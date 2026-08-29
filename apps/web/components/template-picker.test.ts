import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { TemplatePicker } from "./template-picker";

describe("TemplatePicker",()=>{
  test("renders nothing while closed",()=>{
    expect(renderToStaticMarkup(
      createElement(TemplatePicker,{open:false,busy:false,error:null,onClose:vi.fn(),onChoose:vi.fn()}),
    )).toBe("");
  });

  test("offers both starter builds and scratch mode",()=>{
    const markup=renderToStaticMarkup(
      createElement(TemplatePicker,{open:true,busy:false,error:null,onClose:vi.fn(),onChoose:vi.fn()}),
    );
    expect(markup).toContain("Choose a starting point");
    expect(markup).toContain("RTX 4060 Gaming PC");
    expect(markup).toContain("High-End Gaming PC");
    expect(markup).toContain("Start from scratch");
    expect(markup).toContain('role="dialog"');
  });
});
