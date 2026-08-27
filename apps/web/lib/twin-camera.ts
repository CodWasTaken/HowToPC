export type TwinView = "ISO" | "FRONT" | "SIDE" | "TOP";
export type CameraVec3 = readonly [number, number, number];

export interface CameraPose {
  position: CameraVec3;
  target: CameraVec3;
}

function fitDistance(caseSize: readonly [number, number, number]): number {
  const maxDimension = Math.max(...caseSize) / 100;
  return Math.max(4.2, maxDimension * 1.45);
}

export function cameraPoseForView(view: TwinView, caseSize: readonly [number, number, number]): CameraPose {
  const distance = fitDistance(caseSize);
  const target: CameraVec3 = [0, 0, 0];
  if (view === "FRONT") return { position: [0, 0, -distance], target };
  if (view === "SIDE") return { position: [distance, 0, 0], target };
  if (view === "TOP") return { position: [0, distance, 0.001], target };
  return { position: [distance * 0.82, distance * 0.64, distance], target };
}
