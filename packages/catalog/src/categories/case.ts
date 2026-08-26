import { z } from "zod";
const formFactor=z.enum(["MINI_ITX","MATX","ATX","EATX"]);
export const caseSpecSchema=z.object({ schemaVersion:z.literal(1), supportedMotherboardFormFactors:z.array(formFactor).min(1), maxGpuLengthMm:z.number().positive(), maxCpuCoolerHeightMm:z.number().positive(), psuFormFactors:z.array(z.enum(["ATX","SFX","SFX_L"])).min(1) });
export type CaseSpec=z.infer<typeof caseSpecSchema>;
