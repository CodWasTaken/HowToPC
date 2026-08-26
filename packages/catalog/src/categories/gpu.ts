import { z } from "zod";
export const gpuSpecSchema = z.object({ schemaVersion:z.literal(1), lengthMm:z.number().nonnegative(), heightMm:z.number().positive().optional(), slotWidth:z.number().positive(), tdpWatts:z.number().nonnegative(), powerConnectors:z.record(z.string(),z.number().int().nonnegative()).default({}) });
export type GpuSpec = z.infer<typeof gpuSpecSchema>;
