import { z } from "zod";
export const storageSpecSchema=z.object({
  schemaVersion:z.literal(1), interface:z.enum(["SATA","NVME","SAS"]), formFactor:z.string().min(1), capacityBytes:z.number().int().positive(),
  driveType:z.enum(["SSD","HDD"]).optional(), pcieGeneration:z.number().positive().optional(), readMbps:z.number().nonnegative().optional(), writeMbps:z.number().nonnegative().optional(), enduranceTbw:z.number().nonnegative().optional(), rpm:z.number().int().positive().optional(), cacheBytes:z.number().int().nonnegative().optional(),
});
export type StorageSpec=z.infer<typeof storageSpecSchema>;
