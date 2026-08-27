import { z } from "zod";

const formFactor=z.enum(["MINI_ITX","MATX","ATX","EATX"]);
const dimensionsMm=z.object({
  width:z.number().positive().optional(), height:z.number().positive().optional(), depth:z.number().positive().optional(),
});

export const caseSpecSchema=z.object({
  schemaVersion:z.literal(1), supportedMotherboardFormFactors:z.array(formFactor).min(1),
  maxGpuLengthMm:z.number().positive(), maxCpuCoolerHeightMm:z.number().positive(),
  psuFormFactors:z.array(z.enum(["ATX","SFX","SFX_L"])).min(1).optional(),
  internal25Bays:z.number().int().nonnegative().optional(), internal35Bays:z.number().int().nonnegative().optional(),
  expansionSlots:z.number().int().nonnegative().optional(), sidePanel:z.string().min(1).optional(),
  dimensionsMm:dimensionsMm.optional(),
});

export type CaseSpec=z.infer<typeof caseSpecSchema>;