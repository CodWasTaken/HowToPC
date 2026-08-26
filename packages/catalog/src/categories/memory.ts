import { z } from "zod";
export const memorySpecSchema = z.object({ schemaVersion:z.literal(1), type:z.enum(["DDR4","DDR5"]), modules:z.number().int().positive(), moduleCapacityBytes:z.number().int().positive(), speedMt:z.number().int().positive().optional(), ecc:z.boolean().default(false) });
export type MemorySpec = z.infer<typeof memorySpecSchema>;
