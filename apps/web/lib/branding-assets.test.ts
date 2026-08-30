import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { metadata } from "../app/layout";

const here=fileURLToPath(new URL(".",import.meta.url));
const appRoot=fileURLToPath(new URL("../",import.meta.url));

function source(relative:string){
  return readFileSync(new URL(relative,import.meta.url),"utf8");
}

describe("HowToPC branding",()=>{
  test("uses the logo in the visible workspace header",()=>{
    const workspace=source("../components/builder-workspace.tsx");
    expect(workspace).toContain('src="/howtopc-logo.png"');
    expect(workspace).toContain('alt="HowToPC"');
  });

  test("publishes favicon and social preview metadata",()=>{
    expect(metadata.icons).toBeTruthy();
    expect(metadata.openGraph?.images).toEqual(expect.arrayContaining([
      expect.objectContaining({url:"/howtopc-og.jpg",width:1920,height:1080}),
    ]));
  });

  test("ships the referenced branding assets",()=>{
    expect(existsSync(`${appRoot}app/favicon.ico`)).toBe(true);
    expect(existsSync(`${appRoot}public/howtopc-logo.png`)).toBe(true);
    expect(existsSync(`${appRoot}public/howtopc-og.jpg`)).toBe(true);
  });

  test("encodes favicon PNG frames as RGBA for the Next image pipeline",()=>{
    const ico=readFileSync(`${appRoot}app/favicon.ico`);
    const count=ico.readUInt16LE(4);
    const colorTypes:number[]=[];
    for(let i=0;i<count;i++){
      const entry=6+i*16;
      const imageOffset=ico.readUInt32LE(entry+12);
      const pngSignature=ico.subarray(imageOffset,imageOffset+8).toString("hex");
      if(pngSignature==="89504e470d0a1a0a")colorTypes.push(ico[imageOffset+25]);
    }
    expect(colorTypes.length).toBeGreaterThan(0);
    expect(colorTypes.every((type)=>type===6)).toBe(true);
  });
});
