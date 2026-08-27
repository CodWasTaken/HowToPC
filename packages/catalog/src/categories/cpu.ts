import { z } from "zod";
export const cpuSpecSchema = z.object({
  schemaVersion:z.literal(1), socket:z.string().min(1), tdpWatts:z.number().nonnegative(), integratedGraphics:z.boolean().optional(),
  family:z.string().min(1).optional(), cores:z.number().int().positive().optional(), threads:z.number().int().positive().optional(), releaseYear:z.number().int().min(1970).max(2100).optional(),
});
export type CpuSpec = z.infer<typeof cpuSpecSchema>;
