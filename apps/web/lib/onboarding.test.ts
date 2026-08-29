import { describe, expect, test } from "vitest";
import {
  ONBOARDING_STORAGE_KEY,
  markOnboardingSeen,
  shouldShowOnboarding,
} from "./onboarding";

describe("onboarding persistence",()=>{
  test("shows onboarding when no first-visit marker exists",()=>{
    const storage={getItem:()=>null};
    expect(shouldShowOnboarding(storage)).toBe(true);
  });

  test("does not show onboarding after it has been marked seen",()=>{
    const values=new Map<string,string>();
    const storage={
      getItem:(key:string)=>values.get(key)??null,
      setItem:(key:string,value:string)=>{values.set(key,value);},
    };
    markOnboardingSeen(storage);
    expect(values.get(ONBOARDING_STORAGE_KEY)).toBe("seen");
    expect(shouldShowOnboarding(storage)).toBe(false);
  });
});
