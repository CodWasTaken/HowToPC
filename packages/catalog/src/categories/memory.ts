import { z } from "zod";

export const memorySpecSchema = z.object({
  schemaVersion:z.literal(1), type:z.enum(["DDR1","DDR2","DDR3","DDR4","DDR5"]),
  modules:z.number().int().positive(), moduleCapacityBytes:z.number().int().positive(),
  speedMt:z.number().int().positive().optional(), ecc:z.boolean().default(false),
  formFactor:z.enum(["DIMM","SO_DIMM"]).optional(), casLatency:z.number().positive().optional(),
  timings:z.string().min(1).optional(),
});

export type MemorySpec = z.infer<typeof memorySpecSchema>;