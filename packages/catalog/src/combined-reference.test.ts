import { describe, expect, test } from "vitest";
import { bestReferenceOffer, referenceCatalog } from "./index";

describe("combined reference catalog", () => {
  test("includes legacy BuildCores hardware without inventing a price", () => {
    const cpu = referenceCatalog.find((product) => product.id === "buildcores-d879b83e-b826-46ad-b008-a51b9674da07");
    const board = referenceCatalog.find((product) => product.id === "buildcores-a750515d-6abd-4126-9830-e2700b884aed");
    const memory = referenceCatalog.find((product) => product.id === "buildcores-6e633a97-ab51-42c4-a221-0ec9b37ee511");
    expect(cpu?.specs).toMatchObject({ socket: "LGA1155" });
    expect(board?.specs).toMatchObject({ memoryType: "DDR3" });
    expect(memory?.specs).toMatchObject({ type: "DDR3" });
    expect(cpu?.source?.evidence).toBe("OPEN_DATA");
    expect(bestReferenceOffer(cpu!.id)).toBeUndefined();
  });
});
