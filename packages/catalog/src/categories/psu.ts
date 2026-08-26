import { z } from "zod";
export const psuSpecSchema=z.object({ schemaVersion:z.literal(1), formFactor:z.enum(["ATX","SFX","SFX_L"]), wattage:z.number().positive(), connectors:z.record(z.string(),z.number().int().nonnegative()).default({}) });
export type PsuSpec=z.infer<typeof psuSpecSchema>;
