import { z } from "zod";
export const cpuSpecSchema = z.object({ schemaVersion:z.literal(1), socket:z.string().min(1), tdpWatts:z.number().nonnegative(), integratedGraphics:z.boolean().optional() });
export type CpuSpec = z.infer<typeof cpuSpecSchema>;
