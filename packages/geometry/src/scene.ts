import type { ReferenceProduct } from "@howtopc/catalog";
export type Vec3 = readonly [number, number, number];
export interface SceneBox { id:string; label:string; category:string; size:Vec3; position:Vec3; }
export interface ParametricScene { caseBox:SceneBox; components:readonly SceneBox[]; }
const specs=(product:ReferenceProduct)=>product.specs as Record<string,any>;
function caseSize(pcCase:ReferenceProduct):Vec3 {
  const compact=(specs(pcCase).supportedMotherboardFormFactors as string[]).every(ff=>ff==="MINI_ITX");
  return compact ? [185,340,Math.max(360,Number(specs(pcCase).maxGpuLengthMm)+30)] : [230,470,Math.max(430,Number(specs(pcCase).maxGpuLengthMm)+70)];
}
function boardSize(formFactor:string):Vec3 {
  if(formFactor==="MINI_ITX")return [170,170,8]; if(formFactor==="MATX")return [244,244,8]; if(formFactor==="EATX")return [330,305,8]; return [244,305,8];
}
function sizeFor(product:ReferenceProduct):Vec3 {
  const s=specs(product);
  switch(product.category){
    case "MOTHERBOARD": return boardSize(String(s.formFactor));
    case "GPU": return [Math.max(40,Number(s.slotWidth)*20.32),Number(s.heightMm??120),Number(s.lengthMm)];
    case "PSU": return s.formFactor==="SFX"?[125,64,100]:[150,86,140];
    case "COOLER": return s.type==="AIO"?[30,Number(s.radiatorSizeMm??240),120]:[120,Number(s.heightMm??100),120];
    case "MEMORY": return [18,45,135];
    case "CPU": return [40,5,40];
    case "STORAGE": return String(s.formFactor).includes("M.2")?[22,3,80]:[102,26,147];
    case "NETWORK": return [20,70,120];
    default: return [40,40,40];
  }
}
export function buildParametricScene(products:readonly ReferenceProduct[]):ParametricScene {
  const pcCase=products.find(p=>p.category==="CASE"); if(!pcCase)throw new Error("A case is required for the digital twin.");
  const size=caseSize(pcCase); const caseBox:SceneBox={id:pcCase.id,label:pcCase.displayName,category:"CASE",size,position:[0,0,0]};
  const offsets:Record<string,Vec3>={MOTHERBOARD:[-20,20,-20],GPU:[20,-15,10],PSU:[0,-size[1]/2+55,size[2]/2-95],COOLER:[-20,45,-20],MEMORY:[30,45,-45],CPU:[-20,45,-20],STORAGE:[35,5,-80],NETWORK:[35,-10,20]};
  const components=products.filter(p=>p.category!=="CASE").map(product=>({id:product.id,label:product.displayName,category:product.category,size:sizeFor(product),position:offsets[product.category]??[0,0,0]}));
  return {caseBox,components};
}
