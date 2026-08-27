import { z } from "zod";
export const fanSpecSchema=z.object({
  schemaVersion:z.literal(1), sizeMm:z.number().int().positive(), thicknessMm:z.number().positive().default(25), connector:z.enum(["PWM_4","DC_3"]).optional(),
  quantity:z.number().int().positive().optional(), minAirflowCfm:z.number().nonnegative().optional(), maxAirflowCfm:z.number().nonnegative().optional(), minNoiseDb:z.number().nonnegative().optional(), maxNoiseDb:z.number().nonnegative().optional(), staticPressureMmH2o:z.number().nonnegative().optional(), pwm:z.boolean().optional(), flowDirection:z.string().min(1).optional(),
});
export type FanSpec=z.infer<typeof fanSpecSchema>;
