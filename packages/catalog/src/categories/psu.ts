import { z } from "zod";

export const psuSpecSchema=z.object({
  schemaVersion:z.literal(1), formFactor:z.enum(["ATX","SFX","SFX_L"]), wattage:z.number().positive(),
  connectors:z.record(z.string(),z.number().int().nonnegative()).default({}),
  efficiencyRating:z.enum(["STANDARD","BRONZE","SILVER","GOLD","PLATINUM","TITANIUM"]).optional(),
  modularity:z.enum(["FIXED","SEMI","FULL"]).optional(), atxVersion:z.string().min(1).optional(),
  lengthMm:z.number().positive().optional(), fanless:z.boolean().optional(),
});

export type PsuSpec=z.infer<typeof psuSpecSchema>;