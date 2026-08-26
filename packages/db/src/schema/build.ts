import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { productRevisions } from "./product";
export const builds = pgTable("builds", {
  id: text("id").primaryKey(),
  mode: text("mode").notNull(),
  name: text("name"),
  currentRevisionId: text("current_revision_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
export const buildRevisions = pgTable("build_revisions", {
  id: text("id").primaryKey(),
  buildId: text("build_id").notNull().references(() => builds.id),
  parentRevisionId: text("parent_revision_id"),
  goals: jsonb("goals").notNull().default({}),
  workloads: jsonb("workloads").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
export const buildItems = pgTable("build_items", {
  id: text("id").primaryKey(),
  buildRevisionId: text("build_revision_id").notNull().references(() => buildRevisions.id),
  productRevisionId: text("product_revision_id").notNull().references(() => productRevisions.id),
  quantity: integer("quantity").notNull().default(1)
});
export const analysisSnapshots = pgTable("analysis_snapshots", {
  id: text("id").primaryKey(),
  buildRevisionId: text("build_revision_id").notNull().references(() => buildRevisions.id),
  kind: text("kind").notNull(),
  modelVersion: text("model_version").notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
