import type { ReferenceProduct } from "@howtopc/catalog";
import type { BuildProducts,CompatibilityRuleResult } from "./rule";
const first=(products:BuildProducts,category:string)=>products.find(p=>p.category===category);
const specs=(product:ReferenceProduct)=>product.specs as Record<string,any>;
function compareRule(ruleId:string,a:ReferenceProduct|undefined,b:ReferenceProduct|undefined,compatible:(a:Record<string,any>,b:Record<string,any>)=>boolean,ok:string,fail:string):CompatibilityRuleResult|undefined{
 if(!a||!b)return undefined; const passes=compatible(specs(a),specs(b));
 return {ruleId,status:passes?"COMPATIBLE":"INCOMPATIBLE",message:passes?ok:fail,involvedIds:[a.id,b.id]};
}
export function evaluateMvpRules(products:BuildProducts):CompatibilityRuleResult[]{
 const cpu=first(products,"CPU"),board=first(products,"MOTHERBOARD"),memory=first(products,"MEMORY"),gpu=first(products,"GPU"),pcCase=first(products,"CASE"),psu=first(products,"PSU"),cooler=first(products,"COOLER");
 const results:CompatibilityRuleResult[]=[];
 const pairs=[
 compareRule("cpu-motherboard-socket",cpu,board,(c,b)=>c.socket===b.socket,"CPU socket matches motherboard.","CPU socket does not match motherboard."),
 compareRule("memory-motherboard",memory,board,(m,b)=>m.type===b.memoryType,"Memory generation matches motherboard.","Memory generation does not match motherboard."),
 compareRule("motherboard-case-form-factor",board,pcCase,(b,c)=>(c.supportedMotherboardFormFactors as string[]).includes(b.formFactor),"Motherboard form factor fits case.","Motherboard form factor is not supported by case."),
 compareRule("gpu-case-length",gpu,pcCase,(g,c)=>g.lengthMm<=c.maxGpuLengthMm,"GPU length fits case clearance.","GPU is longer than the case GPU clearance."),
 compareRule("psu-case-form-factor",psu,pcCase,(p,c)=>(c.psuFormFactors as string[]).includes(p.formFactor),"PSU form factor fits case.","PSU form factor is not supported by case."),
 compareRule("cooler-cpu-socket",cooler,cpu,(c,p)=>(c.supportedSockets as string[]).includes(p.socket),"Cooler supports CPU socket.","Cooler does not support CPU socket.")];
 for(const result of pairs)if(result)results.push(result);
 if(cooler&&pcCase&&specs(cooler).type==="AIR"&&specs(cooler).heightMm){const fits=specs(cooler).heightMm<=specs(pcCase).maxCpuCoolerHeightMm;results.push({ruleId:"cooler-case-height",status:fits?"COMPATIBLE":"INCOMPATIBLE",message:fits?"CPU cooler height fits case.":"CPU cooler is taller than case clearance.",involvedIds:[cooler.id,pcCase.id]});}
 if(board){const nvme=products.filter(p=>p.category==="STORAGE"&&specs(p).interface==="NVME").length;const sata=products.filter(p=>p.category==="STORAGE"&&specs(p).interface==="SATA").length;const fits=nvme<=specs(board).m2Slots&&sata<=specs(board).sataPorts;results.push({ruleId:"storage-interface-capacity",status:fits?"COMPATIBLE":"INCOMPATIBLE",message:fits?"Storage devices fit available motherboard interfaces.":"Storage devices exceed motherboard interface capacity.",involvedIds:[board.id,...products.filter(p=>p.category==="STORAGE").map(p=>p.id)]});}
 if(psu&&(cpu||gpu)){const demand=(cpu?Number(specs(cpu).tdpWatts??0):0)+(gpu?Number(specs(gpu).tdpWatts??0):0)+100;const supply=Number(specs(psu).wattage??0);const status=supply<demand?"INCOMPATIBLE":supply<demand*1.2?"WARNING":"COMPATIBLE";results.push({ruleId:"psu-power-headroom",status,message:status==="INCOMPATIBLE"?`Estimated ${demand}W demand exceeds ${supply}W PSU.`:status==="WARNING"?`PSU has limited headroom above estimated ${demand}W demand.`:`PSU has reasonable headroom above estimated ${demand}W demand.`,involvedIds:[psu.id,...(cpu?[cpu.id]:[]),...(gpu?[gpu.id]:[])]});}
 if(psu&&gpu){const required=specs(gpu).powerConnectors as Record<string,number>|undefined;const available=specs(psu).connectors as Record<string,number>|undefined;const fits=Object.entries(required??{}).every(([kind,count])=>(available?.[kind]??0)>=count);results.push({ruleId:"gpu-psu-connectors",status:fits?"COMPATIBLE":"INCOMPATIBLE",message:fits?"PSU has the GPU power connectors required.":"PSU lacks required native GPU power connectors.",involvedIds:[gpu.id,psu.id]});}
 return results;
}
