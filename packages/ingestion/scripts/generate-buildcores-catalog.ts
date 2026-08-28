import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILDCORES_SOURCE_CATEGORIES,
  GENERATED_CATALOG_CATEGORIES,
  generateCatalogArtifacts,
  type BuildCoresCatalogInputRecord,
} from "../src/catalog-artifacts";

const PINNED_BUILDCORES_COMMIT="7f759ec353714e9dca2adab9e62bd80311fc373e";
const dbDir=process.env.BUILDCORES_DB_DIR;
if(!dbDir)throw new Error("BUILDCORES_DB_DIR is required");

const sourceCommit=execFileSync("git",["-C",dbDir,"rev-parse","HEAD"],{encoding:"utf8"}).trim();
if(sourceCommit!==PINNED_BUILDCORES_COMMIT&&process.env.ALLOW_BUILDCORES_COMMIT_MISMATCH!=="1"){
  throw new Error(
    `BuildCores commit mismatch: expected ${PINNED_BUILDCORES_COMMIT}, got ${sourceCommit}. `+
    "Set ALLOW_BUILDCORES_COMMIT_MISMATCH=1 only for an intentional override.",
  );
}

const compareText=(left:string,right:string):number=>left===right?0:left<right?-1:1;
const records:BuildCoresCatalogInputRecord[]=[];
for(const sourceCategory of BUILDCORES_SOURCE_CATEGORIES){
  const sourceDir=resolve(dbDir,"open-db",sourceCategory);
  const files=readdirSync(sourceDir,{withFileTypes:true})
    .filter((entry)=>entry.isFile()&&entry.name.endsWith(".json"))
    .map((entry)=>entry.name)
    .sort(compareText);
  for(const file of files){
    const raw=JSON.parse(readFileSync(resolve(sourceDir,file),"utf8")) as unknown;
    records.push({sourceCategory,raw});
  }
}

const artifacts=generateCatalogArtifacts(records,{sourceCommit});
const scriptDir=dirname(fileURLToPath(import.meta.url));
const outputDir=resolve(scriptDir,"../../catalog/data/buildcores");
rmSync(outputDir,{recursive:true,force:true});
mkdirSync(outputDir,{recursive:true});
const writeJson=(name:string,value:unknown):void=>{
  writeFileSync(resolve(outputDir,name),`${JSON.stringify(value,null,2)}\n`,"utf8");
};

for(const category of GENERATED_CATALOG_CATEGORIES){
  writeJson(`${category.toLowerCase()}.json`,artifacts.shards[category]);
}
writeJson("id-index.json",artifacts.idIndex);
writeJson("import-report.json",artifacts.importReport);
writeJson("facet-summary.json",artifacts.facetSummary);

console.log(
  `BuildCores catalog generated from ${sourceCommit}: `+
  `${artifacts.importReport.totals.accepted} accepted, `+
  `${artifacts.importReport.totals.rejected} rejected, `+
  `${artifacts.importReport.totals.total} total.`,
);
