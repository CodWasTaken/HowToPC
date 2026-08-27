import type { CatalogProduct } from "./search";

export interface ProductSource {
  label: string;
  url?: string;
  evidence: "MANUFACTURER" | "OPEN_DATA" | "RETAILER" | "REFERENCE";
}
export interface ReferenceProduct extends CatalogProduct {
  revisionId: string;
  watts?: number;
  source?: ProductSource;
}

const GiB = 1024 ** 3;
const TiB = 1024 ** 4;
const GB = 1000 ** 3;
const fixtureSource: ProductSource = { label: "HowToPC reference fixture", evidence: "REFERENCE" };

export const referenceCatalog: readonly ReferenceProduct[] = [
  {id:"cpu-am5-7600",revisionId:"cpu-am5-7600-r1",manufacturer:"AMD",displayName:"Ryzen 5 7600",category:"CPU",watts:65,source:fixtureSource,specs:{schemaVersion:1,socket:"AM5",tdpWatts:65,integratedGraphics:true}},
  {id:"cpu-am4-5600",revisionId:"cpu-am4-5600-r1",manufacturer:"AMD",displayName:"Ryzen 5 5600",category:"CPU",watts:65,source:fixtureSource,specs:{schemaVersion:1,socket:"AM4",tdpWatts:65,integratedGraphics:false}},
  {id:"mb-b650-atx",revisionId:"mb-b650-atx-r1",manufacturer:"Reference",displayName:"B650 ATX WiFi",category:"MOTHERBOARD",source:fixtureSource,specs:{schemaVersion:1,socket:"AM5",formFactor:"ATX",memoryType:"DDR5",dimmSlots:4,maxMemoryBytes:192*GiB,pcieSlots:3,gpuPcieSlots:2,m2Slots:3,sataPorts:4}},
  {id:"mb-b650-itx",revisionId:"mb-b650-itx-r1",manufacturer:"Reference",displayName:"B650 Mini-ITX",category:"MOTHERBOARD",source:fixtureSource,specs:{schemaVersion:1,socket:"AM5",formFactor:"MINI_ITX",memoryType:"DDR5",dimmSlots:2,maxMemoryBytes:96*GiB,pcieSlots:1,gpuPcieSlots:1,m2Slots:2,sataPorts:2}},
  {id:"ram-ddr5-32",revisionId:"ram-ddr5-32-r1",manufacturer:"Reference",displayName:"32GB DDR5-6000",category:"MEMORY",source:fixtureSource,specs:{schemaVersion:1,type:"DDR5",modules:2,moduleCapacityBytes:16*GiB,speedMt:6000,ecc:false}},
  {id:"ram-ddr4-32",revisionId:"ram-ddr4-32-r1",manufacturer:"Reference",displayName:"32GB DDR4-3600",category:"MEMORY",source:fixtureSource,specs:{schemaVersion:1,type:"DDR4",modules:2,moduleCapacityBytes:16*GiB,speedMt:3600,ecc:false}},
  {id:"gpu-value-270",revisionId:"gpu-value-270-r1",manufacturer:"Reference",displayName:"Value 1440p GPU 270mm",category:"GPU",watts:180,source:fixtureSource,specs:{schemaVersion:1,lengthMm:270,heightMm:115,slotWidth:2.2,tdpWatts:180,powerConnectors:{PCIE_8:1}}},
  {id:"gpu-mid-300",revisionId:"gpu-mid-300-r1",manufacturer:"Reference",displayName:"1440p GPU 300mm",category:"GPU",watts:220,source:fixtureSource,specs:{schemaVersion:1,lengthMm:300,heightMm:120,slotWidth:2.5,tdpWatts:220,powerConnectors:{PCIE_8:2}}},
  {id:"gpu-long-345",revisionId:"gpu-long-345-r1",manufacturer:"Reference",displayName:"High-End GPU 345mm",category:"GPU",watts:320,source:fixtureSource,specs:{schemaVersion:1,lengthMm:345,heightMm:135,slotWidth:3.2,tdpWatts:320,powerConnectors:{PCIE_8:3}}},
  {id:"case-atx-340",revisionId:"case-atx-340-r1",manufacturer:"Reference",displayName:"Airflow ATX 340",category:"CASE",source:fixtureSource,specs:{schemaVersion:1,supportedMotherboardFormFactors:["MINI_ITX","MATX","ATX"],maxGpuLengthMm:340,maxCpuCoolerHeightMm:170,psuFormFactors:["ATX","SFX"]}},
  {id:"case-atx-380",revisionId:"case-atx-380-r1",manufacturer:"Reference",displayName:"Roomy ATX 380",category:"CASE",source:fixtureSource,specs:{schemaVersion:1,supportedMotherboardFormFactors:["MINI_ITX","MATX","ATX","EATX"],maxGpuLengthMm:380,maxCpuCoolerHeightMm:180,psuFormFactors:["ATX","SFX","SFX_L"]}},
  {id:"case-itx-320",revisionId:"case-itx-320-r1",manufacturer:"Reference",displayName:"Compact ITX 320",category:"CASE",source:fixtureSource,specs:{schemaVersion:1,supportedMotherboardFormFactors:["MINI_ITX"],maxGpuLengthMm:320,maxCpuCoolerHeightMm:70,psuFormFactors:["SFX","SFX_L"]}},
  {id:"psu-atx-750",revisionId:"psu-atx-750-r1",manufacturer:"Reference",displayName:"750W ATX Gold",category:"PSU",source:fixtureSource,specs:{schemaVersion:1,formFactor:"ATX",wattage:750,connectors:{PCIE_8:3,EPS_8:2}}},
  {id:"psu-sfx-750",revisionId:"psu-sfx-750-r1",manufacturer:"Reference",displayName:"750W SFX Gold",category:"PSU",source:fixtureSource,specs:{schemaVersion:1,formFactor:"SFX",wattage:750,connectors:{PCIE_8:3,EPS_8:2}}},
  {id:"cooler-air-158",revisionId:"cooler-air-158-r1",manufacturer:"Reference",displayName:"Tower Air 158",category:"COOLER",source:fixtureSource,specs:{schemaVersion:1,type:"AIR",supportedSockets:["AM4","AM5"],heightMm:158}},
  {id:"cooler-low-67",revisionId:"cooler-low-67-r1",manufacturer:"Reference",displayName:"Low Profile 67",category:"COOLER",source:fixtureSource,specs:{schemaVersion:1,type:"AIR",supportedSockets:["AM4","AM5"],heightMm:67}},
  {id:"ssd-nvme-2tb",revisionId:"ssd-nvme-2tb-r1",manufacturer:"Reference",displayName:"2TB NVMe SSD",category:"STORAGE",source:fixtureSource,specs:{schemaVersion:1,interface:"NVME",formFactor:"M.2 2280",capacityBytes:2*TiB}},
  {id:"hdd-sata-8tb",revisionId:"hdd-sata-8tb-r1",manufacturer:"Reference",displayName:"8TB SATA HDD",category:"STORAGE",source:fixtureSource,specs:{schemaVersion:1,interface:"SATA",formFactor:"3.5in",capacityBytes:8*TiB}},
  {id:"nic-10gbe",revisionId:"nic-10gbe-r1",manufacturer:"Reference",displayName:"10GbE PCIe NIC",category:"NETWORK",source:fixtureSource,specs:{schemaVersion:1,interface:"PCIE",speedMbps:10000,ports:1}},
  {id:"cpu-intel-i5-3470",revisionId:"cpu-intel-i5-3470-r1",manufacturer:"Intel",displayName:"Core i5-3470",category:"CPU",watts:77,source:{label:"Intel ARK",url:"https://www.intel.com/content/www/us/en/products/sku/68316/intel-core-i5-3470-processor-6m-cache-up-to-3-60-ghz/specifications.html",evidence:"MANUFACTURER"},specs:{schemaVersion:1,socket:"LGA1155",tdpWatts:77,integratedGraphics:true}},
  {id:"mb-asus-p8h61-m-lx3-r2",revisionId:"mb-asus-p8h61-m-lx3-r2-r1",manufacturer:"ASUS",displayName:"P8H61-M LX3 R2.0",category:"MOTHERBOARD",source:{label:"ASUS manual",url:"https://dlcdnet.asus.com/pub/ASUS/mb/LGA1155/P8H61-M_LX3_R2.0/E7998_P8H61-M_LX3_R2_Series.pdf",evidence:"MANUFACTURER"},specs:{schemaVersion:1,socket:"LGA1155",formFactor:"MATX",memoryType:"DDR3",dimmSlots:2,maxMemoryBytes:16*GiB,pcieSlots:3,gpuPcieSlots:1,m2Slots:0,sataPorts:4}},
  {id:"ram-kingston-kvr16n11k2-16",revisionId:"ram-kingston-kvr16n11k2-16-r1",manufacturer:"Kingston",displayName:"ValueRAM KVR16N11K2/16 16GB",category:"MEMORY",source:{label:"Kingston discontinued specification",url:"https://www.kingston.com/en/memory/search/discontinuedmodels?partId=KVR16N11K2%2F16",evidence:"MANUFACTURER"},specs:{schemaVersion:1,type:"DDR3",modules:2,moduleCapacityBytes:8*GiB,speedMt:1600,ecc:false}},
  {id:"case-silentiumpc-brutus-m10",revisionId:"case-silentiumpc-brutus-m10-r1",manufacturer:"SilentiumPC",displayName:"Brutus M10 Pure Black",category:"CASE",source:{label:"x-kom archived specification",url:"https://www.x-kom.pl/p/328760-obudowa-do-komputera-silentiumpc-brutus-m10-pure-black.html",evidence:"RETAILER"},specs:{schemaVersion:1,supportedMotherboardFormFactors:["MINI_ITX","MATX","ATX"],maxGpuLengthMm:320,maxCpuCoolerHeightMm:159,psuFormFactors:["ATX"]}},
  {id:"psu-chieftec-gps-400aa",revisionId:"psu-chieftec-gps-400aa-r1",manufacturer:"Chieftec",displayName:"GPS-400AA-101 A 400W",category:"PSU",source:{label:"Observed retailer specification",evidence:"RETAILER"},specs:{schemaVersion:1,formFactor:"ATX",wattage:400,connectors:{}}},
  {id:"cooler-intel-e97379-003",revisionId:"cooler-intel-e97379-003-r1",manufacturer:"Intel",displayName:"E97379-003 Stock Cooler",category:"COOLER",source:{label:"Observed retailer compatibility",evidence:"RETAILER"},specs:{schemaVersion:1,type:"AIR",supportedSockets:["LGA1150","LGA1151","LGA1155","LGA1156"]}},
  {id:"hdd-wd5000aakx",revisionId:"hdd-wd5000aakx-r1",manufacturer:"Western Digital",displayName:"WD Blue WD5000AAKX 500GB",category:"STORAGE",source:{label:"Observed retailer specification",evidence:"RETAILER"},specs:{schemaVersion:1,interface:"SATA",formFactor:"3.5in",capacityBytes:500*GB}},
];
