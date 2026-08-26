import { bestOfferForProduct, type OfferCondition, type OfferObservation } from "./offers";

const observedAt = "2026-08-27T00:00:00+02:00";
const estimate = (productId: string, amountPln: number): OfferObservation => ({
  id: `estimate-${productId}`,
  productId,
  source: "HowToPC curated estimate",
  condition: "NEW",
  amountPln,
  observedAt,
  kind: "CURATED_ESTIMATE",
});

export const referenceOffers: readonly OfferObservation[] = [
  estimate("cpu-am5-7600", 820),
  estimate("cpu-am4-5600", 450),
  estimate("mb-b650-atx", 760),
  estimate("mb-b650-itx", 900),
  estimate("ram-ddr5-32", 410),
  estimate("ram-ddr4-32", 280),
  estimate("gpu-value-270", 1810),
  estimate("gpu-mid-300", 2240),
  estimate("gpu-long-345", 3270),
  estimate("case-atx-340", 410),
  estimate("case-atx-380", 540),
  estimate("case-itx-320", 560),
  estimate("psu-atx-750", 450),
  estimate("psu-sfx-750", 620),
  estimate("cooler-air-158", 195),
  estimate("cooler-low-67", 205),
  estimate("ssd-nvme-2tb", 495),
  estimate("hdd-sata-8tb", 645),
  estimate("nic-10gbe", 345),
  {id:"used-i5-3470-allegro",productId:"cpu-intel-i5-3470",source:"Allegro observed listing",condition:"USED",amountPln:13,observedAt,kind:"LISTING",url:"https://allegro.pl/listing?string=i5+3470"},
  {id:"used-i5-3470-allegro-alt",productId:"cpu-intel-i5-3470",source:"Allegro observed listing",condition:"USED",amountPln:20,observedAt,kind:"LISTING",url:"https://allegro.pl/listing?string=i5+3470"},
  {id:"used-p8h61-allegro",productId:"mb-asus-p8h61-m-lx3-r2",source:"Allegro Lokalnie observed listing",condition:"USED",amountPln:90,observedAt,kind:"LISTING",url:"https://allegro.pl/listing?string=asus+p8h61+m+lx3"},
  {id:"used-p8h61-allegro-alt",productId:"mb-asus-p8h61-m-lx3-r2",source:"Allegro observed listing",condition:"USED",amountPln:109,observedAt,kind:"LISTING",url:"https://allegro.pl/listing?string=asus+p8h61+m+lx3"},
  {id:"used-kvr16n11k2-16",productId:"ram-kingston-kvr16n11k2-16",source:"Allegro observed listing",condition:"USED",amountPln:169,observedAt,kind:"LISTING",url:"https://allegro.pl/listing?string=kvr16n11k2+16"},
  {id:"used-brutus-m10",productId:"case-silentiumpc-brutus-m10",source:"Allegro observed listing",condition:"USED",amountPln:45,observedAt,kind:"LISTING",url:"https://allegro.pl/listing?string=silentiumpc+brutus+m10"},
  {id:"used-chieftec-400",productId:"psu-chieftec-gps-400aa",source:"Allegro observed listing",condition:"USED",amountPln:80,observedAt,kind:"LISTING",url:"https://allegro.pl/listing?string=chieftec+gps+400aa"},
  {id:"used-intel-e97379",productId:"cooler-intel-e97379-003",source:"Allegro observed listing",condition:"USED",amountPln:4.99,observedAt,kind:"LISTING",url:"https://allegro.pl/listing?string=intel+e97379"},
  {id:"used-wd5000aakx",productId:"hdd-wd5000aakx",source:"Allegro observed listing",condition:"USED",amountPln:50,observedAt,kind:"LISTING",url:"https://allegro.pl/listing?string=wd5000aakx"},
];

export const bestReferenceOffer = (productId: string, condition?: OfferCondition) =>
  bestOfferForProduct(referenceOffers, productId, condition);

export const referencePricePln = (productId: string) => bestReferenceOffer(productId)?.amountPln;
