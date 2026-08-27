import { fanSpecSchema } from "@howtopc/catalog";
import { finite, integer, reject, text, validate, type BuildCoresMappingResult } from "./common";

function fanConnector(raw:Record<string,any>):"PWM_4"|"DC_3"|undefined {
  const connector=text(raw.connector); if(!connector)return;
  const standardPwm=/(?:4[- ]pin\s+pwm|pwm\s+4[- ]pin)/i.test(connector);
  const threePin=/3[- ]pin/i.test(connector);
  if(raw.pwm===true)return standardPwm?"PWM_4":undefined;
  if(raw.pwm===false)return threePin?"DC_3":undefined;
  if(standardPwm)return "PWM_4";
  if(threePin&&!/pwm/i.test(connector))return "DC_3";
}

export function mapFan(raw:Record<string,any>):BuildCoresMappingResult {
  const size=integer(raw.size); if(size===null||size<=0)return reject("MISSING_REQUIRED_FIELD","Case fan size is required");
  const connector=fanConnector(raw),quantity=integer(raw.quantity),minAir=finite(raw.min_airflow),maxAir=finite(raw.max_airflow);
  const minNoise=finite(raw.min_noise_level),maxNoise=finite(raw.max_noise_level),pressure=finite(raw.static_pressure),flow=text(raw.flow_direction);
  const specs={schemaVersion:1 as const,sizeMm:size,...(connector?{connector}:{}),
    ...(quantity!==null&&quantity>0?{quantity}:{}),...(minAir!==null&&minAir>=0?{minAirflowCfm:minAir}:{}),
    ...(maxAir!==null&&maxAir>=0?{maxAirflowCfm:maxAir}:{}),...(minNoise!==null&&minNoise>=0?{minNoiseDb:minNoise}:{}),
    ...(maxNoise!==null&&maxNoise>=0?{maxNoiseDb:maxNoise}:{}),...(pressure!==null&&pressure>=0?{staticPressureMmH2o:pressure}:{}),
    ...(typeof raw.pwm==="boolean"?{pwm:raw.pwm}:{}),...(flow?{flowDirection:flow}:{})};
  return validate(fanSpecSchema,"FAN",raw,specs);
}