import { z } from "zod";
export const networkSpecSchema=z.object({ schemaVersion:z.literal(1), interface:z.enum(["PCIE","USB","ONBOARD"]), speedMbps:z.number().positive(), ports:z.number().int().positive() });
export type NetworkSpec=z.infer<typeof networkSpecSchema>;
