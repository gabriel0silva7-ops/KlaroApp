import { pgTable, text, serial, timestamp, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const parsedRecordsTable = pgTable("parsed_records", {
  id: serial("id").primaryKey(),
  rawInputId: integer("raw_input_id").notNull(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(), // stored as ISO date string for flexibility
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  type: text("type").notNull(), // income | expense
  category: text("category").notNull(),
  quantity: real("quantity"), // nullable
  confidence: real("confidence"), // nullable: 0-1 extraction confidence score
  isConfirmed: boolean("is_confirmed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertParsedRecordSchema = createInsertSchema(parsedRecordsTable).omit({ id: true, createdAt: true });
export type InsertParsedRecord = z.infer<typeof insertParsedRecordSchema>;
export type ParsedRecord = typeof parsedRecordsTable.$inferSelect;
