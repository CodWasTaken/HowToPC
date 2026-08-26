import { jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { manufacturers } from "./manufacturer";
export const products = pgTable("products", {
  id: text("id").primaryKey(),
  manufacturerId: text("manufacturer_id").notNull().references(() => manufacturers.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
export const productRevisions = pgTable("product_revisions", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id),
  category: text("category").notNull(),
  displayName: text("display_name").notNull(),
  productionStatus: text("production_status").notNull(),
  marketAvailabilityStatus: text("market_availability_status").notNull(),
  coverage: jsonb("coverage").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
export const productIdentifiers = pgTable("product_identifiers", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id),
  productRevisionId: text("product_revision_id").references(() => productRevisions.id),
  type: text("type").notNull(),
  value: text("value").notNull(),
  sourceId: text("source_id")
}, table => [uniqueIndex("product_identifier_type_value_uq").on(table.type, table.value)]);
