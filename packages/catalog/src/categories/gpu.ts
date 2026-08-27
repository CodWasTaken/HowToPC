import { z } from "zod";

export const gpuSpecSchema = z.object({
  schemaVersion:z.literal(1), lengthMm:z.number().nonnegative(), heightMm:z.number().positive().optional(),
  slotWidth:z.number().positive(), tdpWatts:z.number().nonnegative(),
  powerConnectors:z.record(z.string(),z.number().int().nonnegative()).default({}),
  chipsetManufacturer:z.string().min(1).optional(), chipset:z.string().min(1).optional(),
  vramBytes:z.number().int().positive().optional(), memoryType:z.string().min(1).optional(),
  interface:z.string().min(1).optional(),
  videoOutputs:z.record(z.string(),z.number().int().nonnegative()).optional(),
});

export type GpuSpec = z.infer<typeof gpuSpecSchema>;