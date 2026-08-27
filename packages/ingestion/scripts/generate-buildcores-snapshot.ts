import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { mapBuildCoresProduct, toCatalogSeedProduct } from "../src/index";

const SOURCE_FILES = [
  ["CPU", "d879b83e-b826-46ad-b008-a51b9674da07"],
  ["CPU", "7e3e1ea3-19af-4d0b-b50a-61e344d92236"],
  ["CPU", "b93f8e5b-7352-44bc-9a3c-966a3e7cc603"],
  ["CPU", "047130de-74dd-4b9c-835f-ca2dc1a866fc"],
  ["CPU", "e729304a-edb5-4009-8c21-e348da959fda"],
  ["CPU", "bfd0c295-9f75-4edd-9381-90f88dceb2f7"],
  ["Motherboard", "a750515d-6abd-4126-9830-e2700b884aed"],
  ["Motherboard", "96897fec-763f-493e-a71b-d62a4844c172"],
  ["RAM", "53c21a8d-a300-4ac6-885f-c2d55330d283"],
  ["RAM", "ad23ec52-bcb8-4ff3-a521-06b951dc63f4"],
  ["RAM", "6e633a97-ab51-42c4-a221-0ec9b37ee511"],
  ["RAM", "ca8f12b3-0a43-43ab-8501-18e1b0ab1cbe"],
  ["RAM", "42193d0b-0738-4ec4-b1d6-130997336136"],
  ["RAM", "779d8edb-29e9-4140-9698-6c847932d55b"],
  ["RAM", "a01605b7-1e3a-43de-8385-e3517d0eab23"],
  ["RAM", "298abd6d-53e8-4695-afb7-764bd0eab591"],
] as const;

const RAW_BASE = "https://raw.githubusercontent.com/buildcores/buildcores-open-db/main/open-db";
const outputPath = resolve(process.cwd(), "packages/catalog/src/generated/buildcores-snapshot.ts");

const products = [];
const rejected: string[] = [];
for (const [category, id] of SOURCE_FILES) {
  const response = await fetch(`${RAW_BASE}/${category}/${id}.json`);
  if (!response.ok) throw new Error(`BuildCores fetch failed for ${category}/${id}: ${response.status}`);
  const normalized = mapBuildCoresProduct(category, await response.json());
  if (!normalized) { rejected.push(`${category}/${id}`); continue; }
  products.push(toCatalogSeedProduct(normalized));
}

products.sort((a, b) => a.category.localeCompare(b.category) || a.displayName.localeCompare(b.displayName));
await mkdir(dirname(outputPath), { recursive: true });
const banner = `// Generated from BuildCores OpenDB (ODC-By 1.0). Do not edit by hand.\n`;
await writeFile(outputPath, `${banner}export const buildCoresSnapshot = ${JSON.stringify(products, null, 2)} as const;\n`);
console.log(`BuildCores snapshot: ${products.length} accepted, ${rejected.length} rejected.`);
if (rejected.length) console.log(`Rejected: ${rejected.join(", ")}`);
