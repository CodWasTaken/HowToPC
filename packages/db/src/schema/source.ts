import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
export const sourceObservations = pgTable("source_observations", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").notNull(),
  sourceType: text("source_type").notNull(),
  sourceReference: text("source_reference").notNull(),
  observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
  factualConfidence: text("factual_confidence").notNull()
});
export const assetRights = pgTable("asset_rights", {
  id: text("id").primaryKey(),
  sourceObservationId: text("source_observation_id").references(() => sourceObservations.id),
  rightsClass: text("rights_class").notNull(),
  attribution: text("attribution"),
  licenseId: text("license_id")
});
