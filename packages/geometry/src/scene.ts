import type { ReferenceProduct } from "@howtopc/catalog";
import { allocateMounts, type PlacementIssue } from "./allocator";
import { detectCollisions, type Collision } from "./collision";
import { expandPhysicalInstances } from "./instances";
import { deriveMountTopology } from "./topology";

export type Vec3 = readonly [number, number, number];

export interface SceneBox {
  id: string;
  label: string;
  category: string;
  size: Vec3;
  position: Vec3;
}

export interface ParametricScene {
  caseBox: SceneBox;
  components: readonly SceneBox[];
  placementIssues: readonly PlacementIssue[];
  collisions: readonly Collision[];
  topologyNotes: readonly string[];
}

function caseBoxFor(pcCase: ReferenceProduct, size: Vec3): SceneBox {
  return {
    id: pcCase.id,
    label: pcCase.displayName,
    category: "CASE",
    size,
    position: [0, 0, 0],
  };
}
export function buildParametricScene(products: readonly ReferenceProduct[]): ParametricScene {
  const pcCase = products.find((product) => product.category === "CASE");
  if (!pcCase) throw new Error("A case is required for the digital twin.");

  const topology = deriveMountTopology(products);
  const caseBox = caseBoxFor(pcCase, topology.caseSize);
  const instances = expandPhysicalInstances(products.filter((product) => product.category !== "CASE"));
  const allocation = allocateMounts(instances, topology);
  const byId = new Map(instances.map((instance) => [instance.id, instance]));

  const components = allocation.assignments.flatMap((assignment) => {
    const instance = byId.get(assignment.instanceId);
    if (!instance) return [];
    return [{
      id: instance.id,
      label: instance.label,
      category: instance.category,
      size: instance.size,
      position: assignment.position,
    } satisfies SceneBox];
  });

  const collisions = detectCollisions(components, new Set<string>());
  return {
    caseBox,
    components,
    placementIssues: allocation.issues,
    collisions,
    topologyNotes: topology.notes,
  };
}
