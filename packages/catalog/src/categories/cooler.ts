import { z } from "zod";

export const coolerSpecSchema=z.object({
  schemaVersion:z.literal(1), type:z.enum(["AIR","AIO"]), supportedSockets:z.array(z.string().min(1)).min(1),
  heightMm:z.number().positive().optional(), radiatorSizeMm:z.number().int().positive().optional(),
  fanSizeMm:z.number().positive().optional(), fanQuantity:z.number().int().positive().optional(),
  minRpm:z.number().nonnegative().optional(), maxRpm:z.number().positive().optional(),
  minNoiseDb:z.number().nonnegative().optional(), maxNoiseDb:z.number().nonnegative().optional(),
  fanless:z.boolean().optional(),
});

export type CoolerSpec=z.infer<typeof coolerSpecSchema>;