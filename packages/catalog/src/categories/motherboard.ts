import { z } from "zod";
export const motherboardSpecSchema = z.object({ schemaVersion:z.literal(1), socket:z.string().min(1), formFactor:z.enum(["MINI_ITX","MATX","ATX","EATX"]), memoryType:z.enum(["DDR3","DDR4","DDR5"]), dimmSlots:z.number().int().positive(), maxMemoryBytes:z.number().int().positive(), pcieSlots:z.number().int().nonnegative().default(1), m2Slots:z.number().int().nonnegative().default(0), sataPorts:z.number().int().nonnegative().default(0) });
export type MotherboardSpec = z.infer<typeof motherboardSpecSchema>;
