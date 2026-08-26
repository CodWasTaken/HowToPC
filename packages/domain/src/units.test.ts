import { describe, expect, test } from "vitest";
import { millimetres, money } from "./index";
describe("domain units", () => {
  test("rejects negative physical dimensions", () => expect(() => millimetres(-0.01)).toThrow(/non-negative/i));
  test("money uses integer minor units", () => expect(() => money(19.99, "EUR")).toThrow(/integer minor units/i));
});
