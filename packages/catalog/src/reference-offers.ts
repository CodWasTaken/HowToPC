import { bestOfferForProduct, type OfferCondition, type OfferObservation, type OfferSelection } from "./offers";

const observedAt = "2026-08-27T00:00:00+02:00";
const estimate = (productId: string, amount: number, market: string, currency: string): OfferObservation => ({
  id: `estimate-${market.toLowerCase()}-${productId}`,
  productId,
  source: "HowToPC curated estimate",
  condition: "NEW",
  market,
  currency,
  amount,
  observedAt,
  kind: "CURATED_ESTIMATE",
});

const pl = (productId: string, amount: number) => estimate(productId, amount, "PL", "PLN");
const us = (productId: string, amount: number) => estimate(productId, amount, "US", "USD");

export const referenceOffers: readonly OfferObservation[] = [
  pl("cpu-am5-7600",820),pl("cpu-am4-5600",450),pl("mb-b650-atx",760),pl("mb-b650-itx",900),
  pl("ram-ddr5-32",410),pl("ram-ddr4-32",280),pl("gpu-value-270",1810),pl("gpu-mid-300",2240),pl("gpu-long-345",3270),
  pl("case-atx-340",410),pl("case-atx-380",540),pl("case-itx-320",560),pl("psu-atx-750",450),pl("psu-sfx-750",620),
  pl("cooler-air-158",195),pl("cooler-low-67",205),pl("ssd-nvme-2tb",495),pl("hdd-sata-8tb",645),pl("nic-10gbe",345),
  us("cpu-am5-7600",190),us("cpu-am4-5600",115),us("mb-b650-atx",170),us("mb-b650-itx",205),
  us("ram-ddr5-32",95),us("ram-ddr4-32",65),us("gpu-value-270",420),us("gpu-mid-300",520),us("gpu-long-345",760),
  us("case-atx-340",95),us("case-atx-380",125),us("case-itx-320",130),us("psu-atx-750",105),us("psu-sfx-750",145),
  us("cooler-air-158",45),us("cooler-low-67",48),us("ssd-nvme-2tb",120),us("hdd-sata-8tb",150),us("nic-10gbe",80),
  {id:"used-i5-3470-allegro",productId:"cpu-intel-i5-3470",source:"Allegro observed listing",condition:"USED",market:"PL",currency:"PLN",amount:13,observedAt,kind:"LISTING",url:"https://allegro.pl/listing?string=i5+3470"},
  {id:"used-i5-3470-allegro-alt",productId:"cpu-intel-i5-3470",source:"Allegro observed listing",condition:"USED",market:"PL",currency:"PLN",amount:20,observedAt,kind:"LISTING",url:"https://allegro.pl/listing?string=i5+3470"},
  {id:"used-p8h61-allegro",productId:"mb-asus-p8h61-m-lx3-r2",source:"Allegro Lokalnie observed listing",condition:"USED",market:"PL",currency:"PLN",amount:90,observedAt,kind:"LISTING",url:"https://allegro.pl/listing?string=asus+p8h61+m+lx3"},
  {id:"used-p8h61-allegro-alt",productId:"mb-asus-p8h61-m-lx3-r2",source:"Allegro observed listing",condition:"USED",market:"PL",currency:"PLN",amount:109,observedAt,kind:"LISTING",url:"https://allegro.pl/listing?string=asus+p8h61+m+lx3"},
  {id:"used-kvr16n11k2-16",productId:"ram-kingston-kvr16n11k2-16",source:"Allegro observed listing",condition:"USED",market:"PL",currency:"PLN",amount:169,observedAt,kind:"LISTING",url:"https://allegro.pl/listing?string=kvr16n11k2+16"},
  {id:"used-brutus-m10",productId:"case-silentiumpc-brutus-m10",source:"Allegro observed listing",condition:"USED",market:"PL",currency:"PLN",amount:45,observedAt,kind:"LISTING",url:"https://allegro.pl/listing?string=silentiumpc+brutus+m10"},
  {id:"used-chieftec-400",productId:"psu-chieftec-gps-400aa",source:"Allegro observed listing",condition:"USED",market:"PL",currency:"PLN",amount:80,observedAt,kind:"LISTING",url:"https://allegro.pl/listing?string=chieftec+gps+400aa"},
  {id:"used-intel-e97379",productId:"cooler-intel-e97379-003",source:"Allegro observed listing",condition:"USED",market:"PL",currency:"PLN",amount:4.99,observedAt,kind:"LISTING",url:"https://allegro.pl/listing?string=intel+e97379"},
  {id:"used-wd5000aakx",productId:"hdd-wd5000aakx",source:"Allegro observed listing",condition:"USED",market:"PL",currency:"PLN",amount:50,observedAt,kind:"LISTING",url:"https://allegro.pl/listing?string=wd5000aakx"},
];

export const bestReferenceOffer = (
  productId: string,
  requested: OfferSelection | OfferCondition = { market:"PL" },
) => bestOfferForProduct(referenceOffers, productId, requested);

export const referencePriceForMarket = (productId: string, market: string) =>
  bestReferenceOffer(productId, { market })?.amount;

/** @deprecated Prefer explicit market-aware offer selection. */
export const referencePricePln = (productId: string) =>
  bestReferenceOffer(productId, { market:"PL" })?.amount;
