import { describe, expect, test } from "vitest";
import { referenceCatalog } from "@howtopc/catalog";
import { buildParametricScene } from "./index";

const ids = [
  "cpu-am5-7600", "mb-b650-atx", "ram-ddr5-32", "gpu-mid-300",
  "case-atx-340", "psu-atx-750", "cooler-air-158", "ssd-nvme-2tb",
];
const products = referenceCatalog.filter((p) => ids.includes(p.id));

function byCategory(category: string) {
  const scene = buildParametricScene(products);
  const box = scene.components.find((item) => item.category === category);
  if (!box) throw new Error(`Missing ${category}`);
  return { scene, box };
}

function overlaps(a: { position: readonly number[]; size: readonly number[] }, b: { position: readonly number[]; size: readonly number[] }) {
  return [0, 1, 2].every((axis) =>
    Math.abs(a.position[axis] - b.position[axis]) < (a.size[axis] + b.size[axis]) / 2,
  );
}

describe("parametric digital twin", () => {
  test("uses X width, Y vertical, Z depth for motherboard and GPU", () => {
    const board = byCategory("MOTHERBOARD").box;
    const gpu = byCategory("GPU").box;
    expect(board.size).toEqual([8, 305, 244]);
    expect(gpu.size).toEqual([120, 50.8, 300]);
  });

  test("anchors different PSU sizes to the same rear and floor planes", () => {
    const atxScene = buildParametricScene(products);
    const sfxProducts = products.filter((p) => p.category !== "PSU").concat(
      referenceCatalog.filter((p) => p.id === "psu-sfx-750"),
    );
    const sfxScene = buildParametricScene(sfxProducts);
    const atx = atxScene.components.find((p) => p.category === "PSU")!;
    const sfx = sfxScene.components.find((p) => p.category === "PSU")!;
    const rear = atxScene.caseBox.size[2] / 2;
    const floor = -atxScene.caseBox.size[1] / 2;
    expect(atx.position[2] + atx.size[2] / 2).toBeCloseTo(rear);
    expect(sfx.position[2] + sfx.size[2] / 2).toBeCloseTo(rear);
    expect(atx.position[1] - atx.size[1] / 2).toBeCloseTo(floor);
    expect(sfx.position[1] - sfx.size[1] / 2).toBeCloseTo(floor);
  });

  test("keeps motherboard-attached parts on the component side of the tray", () => {
    const scene = buildParametricScene(products);
    const board = scene.components.find((p) => p.category === "MOTHERBOARD")!;
    const boardFace = board.position[0] + board.size[0] / 2;
    for (const category of ["CPU", "MEMORY", "COOLER", "GPU", "STORAGE"]) {
      const part = scene.components.find((p) => p.category === category)!;
      expect(part.position[0] - part.size[0] / 2).toBeGreaterThanOrEqual(boardFace - 0.01);
    }
  });

  test("keeps Mini-ITX DIMMs and M.2 storage in separate mount zones", () => {
    const itxIds = ids.map((id) => id === "mb-b650-atx" ? "mb-b650-itx" : id);
    const itxProducts = referenceCatalog.filter((product) => itxIds.includes(product.id));
    const scene = buildParametricScene(itxProducts);
    const memory = scene.components.find((part) => part.category === "MEMORY")!;
    const storage = scene.components.find((part) => part.category === "STORAGE")!;
    expect(overlaps(memory, storage)).toBe(false);
  });
});


describe("repeated device placement", () => {
  test("places repeated GPUs and M.2 drives in distinct logical mounts", () => {
    const gpu = referenceCatalog.find((product) => product.id === "gpu-value-270")!;
    const storage = referenceCatalog.find((product) => product.id === "ssd-nvme-2tb")!;
    const base = products.filter((product) => !["GPU", "STORAGE"].includes(product.category));
    const scene = buildParametricScene([...base, gpu, gpu, storage, storage]);
    const gpus = scene.components.filter((part) => part.category === "GPU");
    const drives = scene.components.filter((part) => part.category === "STORAGE");
    expect(gpus).toHaveLength(2);
    expect(drives).toHaveLength(2);
    expect(gpus[0].position).not.toEqual(gpus[1].position);
    expect(drives[0].position).not.toEqual(drives[1].position);
    expect(overlaps(gpus[0], gpus[1])).toBe(false);
    expect(overlaps(drives[0], drives[1])).toBe(false);
  });

  test("renders every DIMM module from repeated memory kits", () => {
    const ram = referenceCatalog.find((product) => product.id === "ram-ddr5-32")!;
    const base = products.filter((product) => product.category !== "MEMORY");
    const scene = buildParametricScene([...base, ram, ram]);
    const dimms = scene.components.filter((part) => part.category === "MEMORY");
    expect(dimms).toHaveLength(4);
    expect(new Set(dimms.map((part) => part.id)).size).toBe(4);
    for (let i = 0; i < dimms.length; i += 1) {
      for (let j = i + 1; j < dimms.length; j += 1) expect(overlaps(dimms[i], dimms[j])).toBe(false);
    }
  });
});

describe("mount-aware scene integration", () => {
  const product = (id: string) => {
    const found = referenceCatalog.find((item) => item.id === id);
    if (!found) throw new Error(`Missing ${id}`);
    return found;
  };

  test("renders a dense supported build without silent overlaps", () => {
    const dense = [
      product("cpu-am5-7600"), product("mb-b650-atx"),
      product("ram-ddr5-32"), product("ram-ddr5-32"),
      product("gpu-value-270"), product("gpu-value-270"),
      product("case-atx-340"), product("psu-atx-750"), product("cooler-air-158"),
      product("ssd-nvme-2tb"), product("ssd-nvme-2tb"), product("ssd-nvme-2tb"),
      product("hdd-sata-8tb"), product("hdd-wd5000aakx"),
      product("hdd-sata-8tb"), product("hdd-wd5000aakx"), product("nic-10gbe"),
    ];
    const scene = buildParametricScene(dense);
    expect(scene.placementIssues).toEqual([]);
    expect(scene.collisions).toEqual([]);
    expect(new Set(scene.components.map((part) => part.id)).size).toBe(scene.components.length);
  });
  test("keeps a sourced-length GPU out of the parametric SATA drive-bay zone", () => {
    const sourceCase = product("case-atx-340");
    const roomyCase = {
      ...sourceCase, id: "case-gpu-drive-clearance", revisionId: "case-gpu-drive-clearance-r1",
      specs: { ...(sourceCase.specs as Record<string, unknown>), maxGpuLengthMm: 365 },
    };
    const gpu = product("gpu-long-345");
    const drive = product("hdd-sata-8tb");
    const scene = buildParametricScene([product("mb-b650-atx"), roomyCase, gpu, drive]);
    expect(scene.collisions.some((collision) =>
      [collision.aId, collision.bId].some((id) => id.startsWith(gpu.id)) &&
      [collision.aId, collision.bId].some((id) => id.startsWith(drive.id)),
    )).toBe(false);
  });

  test("flags AIO radiator placement as unknown instead of pretending it is CPU-mounted", () => {
    const source = product("cooler-air-158");
    const aio = {
      ...source, id: "aio-placement-test", revisionId: "aio-placement-test-r1",
      specs: { schemaVersion: 1 as const, type: "AIO" as const, supportedSockets: ["AM5"], heightMm: 55, radiatorSizeMm: 360 },
    };
    const scene = buildParametricScene([product("mb-b650-atx"), product("case-atx-340"), aio]);
    expect(scene.placementIssues).toContainEqual(expect.objectContaining({
      instanceId: aio.id, code: "TOPOLOGY_UNKNOWN",
    }));
  });

  test("uses sourced case drive-bay capacity instead of synthesizing one bay per drive", () => {
    const sourceCase=product("case-atx-340");
    const pcCase={...sourceCase,id:"case-one-35-bay",revisionId:"case-one-35-bay-r1",specs:{
      ...(sourceCase.specs as Record<string,unknown>),internal25Bays:0,internal35Bays:1,
    }};
    const hdd=product("hdd-sata-8tb");
    const base=[product("mb-b650-atx"),pcCase];
    const scene=buildParametricScene([...base,hdd,hdd]);
    expect(scene.components.filter((part)=>part.category==="STORAGE")).toHaveLength(1);
    expect(scene.placementIssues.filter((issue)=>issue.code==="NO_MOUNT")).toHaveLength(1);
  });

  test("omits unplaced over-capacity DIMMs instead of stacking meshes", () => {
    const overfilled = [
      product("cpu-am5-7600"), product("mb-b650-atx"),
      product("ram-ddr5-32"), product("ram-ddr5-32"), product("ram-ddr5-32"),
      product("case-atx-340"), product("psu-atx-750"), product("cooler-air-158"),
    ];
    const scene = buildParametricScene(overfilled);
    expect(scene.components.filter((part) => part.category === "MEMORY")).toHaveLength(4);
    expect(scene.placementIssues.filter((issue) => issue.code === "NO_MOUNT")).toHaveLength(2);
    expect(scene.topologyNotes.some((note) => note.includes("parametric"))).toBe(true);
  });
});
