import { Router } from "express";
import { db, insightsTable, transactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { generateInsights } from "../lib/insights-engine";

const router = Router();

// GET /insights — list insights for current user
router.get("/insights", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const insights = await db
    .select()
    .from(insightsTable)
    .where(eq(insightsTable.userId, userId))
    .orderBy(insightsTable.createdAt);

  res.json(insights);
});

// POST /insights/generate — generate fresh insights from transaction data
router.post("/insights/generate", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const transactions = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .orderBy(transactionsTable.date);

  // Delete existing insights for the user (refresh)
  await db.delete(insightsTable).where(eq(insightsTable.userId, userId));

  const generated = generateInsights(transactions);

  if (generated.length === 0) {
    res.json([]);
    return;
  }

  const inserted = await db
    .insert(insightsTable)
    .values(
      generated.map((g) => ({
        userId,
        title: g.title,
        description: g.description,
        recommendation: g.recommendation,
        periodLabel: g.periodLabel,
      })),
    )
    .returning();

  res.json(inserted);
});

export default router;
