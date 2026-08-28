import type { ProductCategory } from "@howtopc/domain";
import type { ReferenceProduct } from "../product";
import type { FacetDefinition, FacetValue } from "./types";

type Extractor=(product:ReferenceProduct)=>FacetValue;
const manufacturer:Extractor=(product)=>product.manufacturer;
const releaseYear:Extractor=(product)=>product.releaseYear??null;
const spec=(key:string):Extractor=>(product)=>{
  const value=product.specs[key];
  if(typeof value==="string"||typeof value==="number"||typeof value==="boolean")return value;
  if(Array.isArray(value))return value.filter((item):item is string=>typeof item==="string");
  return null;
};
const recordKeys=(key:string):Extractor=>(product)=>{
  const value=product.specs[key];
  if(!value||typeof value!=="object"||Array.isArray(value))return null;
  return Object.entries(value as Record<string,unknown>)
    .filter(([,count])=>typeof count==="number"&&count>0)
    .map(([name])=>name);
};
const memoryKitCapacity:Extractor=(product)=>{
  const modules=product.specs.modules,moduleCapacity=product.specs.moduleCapacityBytes;
  return typeof modules==="number"&&typeof moduleCapacity==="number"?modules*moduleCapacity:null;
};
const enumFacet=(id:string,label:string,extractor:Extractor,includeUnknown=false):FacetDefinition=>({
  id,label,control:"ENUM",includeUnknown,extractor,
});
const booleanFacet=(id:string,label:string,extractor:Extractor,includeUnknown=true):FacetDefinition=>({
  id,label,control:"BOOLEAN",includeUnknown,extractor,
});
const rangeFacet=(
  id:string,label:string,unit:string,extractor:Extractor,includeUnknown=false,
):FacetDefinition=>({id,label,control:"RANGE",unit,includeUnknown,extractor});

const cpuFacets:readonly FacetDefinition[]=[
  enumFacet("manufacturer","Manufacturer",manufacturer),
  enumFacet("socket","Socket",spec("socket")),
  enumFacet("family","Family / generation",spec("family"),true),
  rangeFacet("cores","Cores","cores",spec("cores"),true),
  rangeFacet("threads","Threads","threads",spec("threads"),true),
  booleanFacet("integratedGraphics","Integrated graphics",spec("integratedGraphics")),
  rangeFacet("tdpWatts","TDP","W",spec("tdpWatts")),
  booleanFacet("unlocked","Unlocked",spec("unlocked")),
  rangeFacet("releaseYear","Release year","year",releaseYear,true),
];
const motherboardFacets:readonly FacetDefinition[]=[
  enumFacet("manufacturer","Manufacturer",manufacturer),
  enumFacet("socket","Socket",spec("socket")),
  enumFacet("chipset","Chipset",spec("chipset"),true),
  enumFacet("formFactor","Form factor",spec("formFactor")),
  enumFacet("memoryType","Memory generation",spec("memoryType")),
  rangeFacet("dimmSlots","DIMM slots","slots",spec("dimmSlots")),
  rangeFacet("maxMemoryBytes","Maximum memory","bytes",spec("maxMemoryBytes")),
  rangeFacet("pcieSlots","PCIe slots","slots",spec("pcieSlots"),true),
  rangeFacet("gpuPcieSlots","GPU-capable PCIe slots","slots",spec("gpuPcieSlots"),true),
  rangeFacet("m2Slots","M.2 slots","slots",spec("m2Slots"),true),
  rangeFacet("sataPorts","SATA ports","ports",spec("sataPorts"),true),
  booleanFacet("wireless","Wi-Fi",spec("wireless")),
  rangeFacet("ethernetSpeedMbps","Ethernet speed","Mb/s",spec("ethernetSpeedMbps"),true),
  booleanFacet("eccSupport","ECC support",spec("eccSupport")),
  rangeFacet("releaseYear","Release year","year",releaseYear,true),
];

const memoryFacets:readonly FacetDefinition[]=[
  enumFacet("manufacturer","Manufacturer",manufacturer),
  enumFacet("type","DDR generation",spec("type")),
  rangeFacet("kitCapacityBytes","Kit capacity","bytes",memoryKitCapacity),
  rangeFacet("modules","Modules per kit","modules",spec("modules")),
  rangeFacet("moduleCapacityBytes","Capacity per module","bytes",spec("moduleCapacityBytes")),
  rangeFacet("speedMt","Speed","MT/s",spec("speedMt"),true),
  booleanFacet("ecc","ECC",spec("ecc")),
  enumFacet("formFactor","Form factor",spec("formFactor"),true),
  rangeFacet("casLatency","CAS latency","CL",spec("casLatency"),true),
  enumFacet("timings","Timings",spec("timings"),true),
  rangeFacet("releaseYear","Release year","year",releaseYear,true),
];

const storageFacets:readonly FacetDefinition[]=[
  enumFacet("manufacturer","Manufacturer",manufacturer),
  enumFacet("storageType","Drive type",spec("storageType"),true),
  enumFacet("interface","Interface",spec("interface")),
  enumFacet("formFactor","Form factor",spec("formFactor")),
  rangeFacet("capacityBytes","Capacity","bytes",spec("capacityBytes")),
  rangeFacet("pcieGeneration","PCIe generation","generation",spec("pcieGeneration"),true),
  rangeFacet("sequentialReadMbps","Sequential read","MB/s",spec("sequentialReadMbps"),true),
  rangeFacet("sequentialWriteMbps","Sequential write","MB/s",spec("sequentialWriteMbps"),true),
  rangeFacet("enduranceTbw","Endurance","TBW",spec("enduranceTbw"),true),
  rangeFacet("rpm","Spindle speed","RPM",spec("rpm"),true),
  rangeFacet("cacheBytes","Cache","bytes",spec("cacheBytes"),true),
  rangeFacet("releaseYear","Release year","year",releaseYear,true),
];
const gpuFacets:readonly FacetDefinition[]=[
  enumFacet("chipsetManufacturer","GPU vendor",spec("chipsetManufacturer"),true),
  enumFacet("manufacturer","Board manufacturer",manufacturer),
  enumFacet("chipset","Chipset / family",spec("chipset"),true),
  rangeFacet("vramBytes","VRAM","bytes",spec("vramBytes"),true),
  enumFacet("memoryType","Memory type",spec("memoryType"),true),
  rangeFacet("lengthMm","Card length","mm",spec("lengthMm")),
  rangeFacet("slotWidth","Slot width","slots",spec("slotWidth")),
  rangeFacet("tdpWatts","TDP","W",spec("tdpWatts")),
  enumFacet("powerConnectors","Power connectors",recordKeys("powerConnectors"),true),
  enumFacet("videoOutputs","Display outputs",recordKeys("videoOutputs"),true),
  enumFacet("interface","PCIe interface",spec("interface"),true),
  rangeFacet("releaseYear","Release year","year",releaseYear,true),
];

const psuFacets:readonly FacetDefinition[]=[
  enumFacet("manufacturer","Manufacturer",manufacturer),
  rangeFacet("wattage","Wattage","W",spec("wattage")),
  enumFacet("formFactor","Form factor",spec("formFactor")),
  enumFacet("efficiencyRating","80 PLUS",spec("efficiencyRating"),true),
  enumFacet("modularity","Modularity",spec("modularity"),true),
  enumFacet("connectors","Connectors",recordKeys("connectors"),true),
  enumFacet("atxVersion","ATX specification",spec("atxVersion"),true),
  rangeFacet("lengthMm","Length","mm",spec("lengthMm"),true),
  booleanFacet("fanless","Fanless",spec("fanless")),
  rangeFacet("releaseYear","Release year","year",releaseYear,true),
];
const caseFacets:readonly FacetDefinition[]=[
  enumFacet("manufacturer","Manufacturer",manufacturer),
  enumFacet("supportedMotherboardFormFactors","Motherboard form factors",spec("supportedMotherboardFormFactors")),
  rangeFacet("maxGpuLengthMm","Maximum GPU length","mm",spec("maxGpuLengthMm")),
  rangeFacet("maxCpuCoolerHeightMm","CPU cooler clearance","mm",spec("maxCpuCoolerHeightMm")),
  enumFacet("psuFormFactors","PSU form factors",spec("psuFormFactors"),true),
  rangeFacet("internal25Bays","2.5-inch bays","bays",spec("internal25Bays"),true),
  rangeFacet("internal35Bays","3.5-inch bays","bays",spec("internal35Bays"),true),
  rangeFacet("expansionSlots","Expansion slots","slots",spec("expansionSlots"),true),
  enumFacet("sidePanel","Side panel",spec("sidePanel"),true),
  rangeFacet("releaseYear","Release year","year",releaseYear,true),
];

const coolerFacets:readonly FacetDefinition[]=[
  enumFacet("manufacturer","Manufacturer",manufacturer),
  enumFacet("type","Cooler type",spec("type")),
  enumFacet("supportedSockets","Supported sockets",spec("supportedSockets")),
  rangeFacet("heightMm","Height","mm",spec("heightMm"),true),
  rangeFacet("radiatorSizeMm","Radiator size","mm",spec("radiatorSizeMm"),true),
  rangeFacet("fanSizeMm","Fan size","mm",spec("fanSizeMm"),true),
  rangeFacet("fanQuantity","Fan count","fans",spec("fanQuantity"),true),
  rangeFacet("minRpm","Minimum fan speed","RPM",spec("minRpm"),true),
  rangeFacet("maxRpm","Maximum fan speed","RPM",spec("maxRpm"),true),
  rangeFacet("minNoiseDb","Minimum noise","dBA",spec("minNoiseDb"),true),
  rangeFacet("maxNoiseDb","Maximum noise","dBA",spec("maxNoiseDb"),true),
  booleanFacet("fanless","Fanless",spec("fanless")),
  rangeFacet("releaseYear","Release year","year",releaseYear,true),
];

const fanFacets:readonly FacetDefinition[]=[
  enumFacet("manufacturer","Manufacturer",manufacturer),
  rangeFacet("sizeMm","Fan size","mm",spec("sizeMm")),
  rangeFacet("thicknessMm","Thickness","mm",spec("thicknessMm"),true),
  enumFacet("connector","Connector",spec("connector"),true),
  rangeFacet("quantity","Pack quantity","fans",spec("quantity"),true),
  rangeFacet("minAirflowCfm","Minimum airflow","CFM",spec("minAirflowCfm"),true),
  rangeFacet("maxAirflowCfm","Maximum airflow","CFM",spec("maxAirflowCfm"),true),
  rangeFacet("minNoiseDb","Minimum noise","dBA",spec("minNoiseDb"),true),
  rangeFacet("maxNoiseDb","Maximum noise","dBA",spec("maxNoiseDb"),true),
  rangeFacet("staticPressureMmH2o","Static pressure","mmH₂O",spec("staticPressureMmH2o"),true),
  booleanFacet("pwm","PWM",spec("pwm")),
  enumFacet("flowDirection","Flow direction",spec("flowDirection"),true),
  rangeFacet("releaseYear","Release year","year",releaseYear,true),
];
const networkFacets:readonly FacetDefinition[]=[
  enumFacet("manufacturer","Manufacturer",manufacturer),
  enumFacet("interface","Interface",spec("interface")),
  rangeFacet("speedMbps","Link speed","Mb/s",spec("speedMbps")),
  rangeFacet("ports","Ports","ports",spec("ports")),
  booleanFacet("wireless","Wireless",spec("wireless")),
  enumFacet("standard","Network standard",spec("standard"),true),
  rangeFacet("releaseYear","Release year","year",releaseYear,true),
];

const hbaFacets:readonly FacetDefinition[]=[
  enumFacet("manufacturer","Manufacturer",manufacturer),
  enumFacet("interface","Host interface",spec("interface"),true),
  enumFacet("connector","Connector",spec("connector"),true),
  enumFacet("generation","Interface generation",spec("generation"),true),
  rangeFacet("ports","Ports","ports",spec("ports"),true),
  rangeFacet("speedMbps","Link speed","Mb/s",spec("speedMbps"),true),
  rangeFacet("releaseYear","Release year","year",releaseYear,true),
];

const FACETS_BY_CATEGORY:Record<ProductCategory,readonly FacetDefinition[]>={
  CPU:cpuFacets,MOTHERBOARD:motherboardFacets,MEMORY:memoryFacets,GPU:gpuFacets,
  STORAGE:storageFacets,PSU:psuFacets,CASE:caseFacets,COOLER:coolerFacets,FAN:fanFacets,
  NETWORK:networkFacets,HBA:hbaFacets,
};

export function facetDefinitionsForCategory(category:ProductCategory):readonly FacetDefinition[] {
  return FACETS_BY_CATEGORY[category];
}
