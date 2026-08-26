import { z } from "zod";
export const storageSpecSchema=z.object({ schemaVersion:z.literal(1), interface:z.enum(["SATA","NVME","SAS"]), formFactor:z.string().min(1), capacityBytes:z.number().int().positive() });
export type StorageSpec=z.infer<typeof storageSpecSchema>;
