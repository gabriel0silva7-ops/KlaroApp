import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rawInputsTable = pgTable("raw_inputs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // csv, xlsx, pdf, image
  originalText: text("original_text"), // nullable: extracted text content
  filePath: text("file_path").notNull(), // local storage path (abstracted for S3 swap)
  processingStatus: text("processing_status").notNull().default("pending"), // pending | processing | done | failed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRawInputSchema = createInsertSchema(rawInputsTable).omit({ id: true, createdAt: true });
export type InsertRawInput = z.infer<typeof insertRawInputSchema>;
export type RawInput = typeof rawInputsTable.$inferSelect;
