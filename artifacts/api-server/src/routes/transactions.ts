import { Router } from "express";
import { db, transactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

// GET /transactions — list confirmed transactions with optional filters
router.get("/transactions", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 100;
  const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0;

  const transactions = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .orderBy(transactionsTable.date)
    .limit(limit)
    .offset(offset);

  // Apply optional filters client-side since Drizzle dynamic conditions need care
  let result = transactions;
  if (req.query.category) {
    result = result.filter((t) => t.category === req.query.category);
  }
  if (req.query.type) {
    result = result.filter((t) => t.type === req.query.type);
  }

  res.json(result);
});

// DELETE /transactions/:id
router.delete("/transactions/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [transaction] = await db
    .select()
    .from(transactionsTable)
    .where(and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)));

  if (!transaction) {
    res.status(404).json({ error: "Transação não encontrada." });
    return;
  }

  await db.delete(transactionsTable).where(eq(transactionsTable.id, id));
  res.sendStatus(204);
});

export default router;
