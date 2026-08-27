"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Edges, OrbitControls } from "@react-three/drei";
import {
  buildParametricScene,
  measureClearances,
  type SceneBox,
  type Vec3,
} from "@howtopc/geometry";
import type { ReferenceProduct } from "@howtopc/catalog";
import { canRenderTwin, formatHoverLabel } from "@/lib/viewport";
import { cameraPoseForView, type TwinView } from "@/lib/twin-camera";
import { TwinToolbar } from "./twin-toolbar";

const categoryColor: Record<string, string> = {
  MOTHERBOARD: "#64748b", GPU: "#2563eb", PSU: "#52525b",
  COOLER: "#0891b2", MEMORY: "#7c3aed", CPU: "#d97706",
  STORAGE: "#059669", NETWORK: "#be123c", HBA: "#9f1239", FAN: "#475569",
};

type OrbitHandle = { target: { set: (x: number, y: number, z: number) => void }; update: () => void };
interface BoxProps {
  box: SceneBox;
  hovered: boolean;
  onHover: (box: SceneBox | null) => void;
}

function Box({ box, hovered, onHover }: BoxProps) {
  const { size, position, category } = box;
  return (
    <mesh
      position={[position[0] / 100, position[1] / 100, position[2] / 100]}
      onPointerOver={(event) => { event.stopPropagation(); onHover(box); }}
      onPointerOut={(event) => { event.stopPropagation(); onHover(null); }}
    >
      <boxGeometry args={[size[0] / 100, size[1] / 100, size[2] / 100]} />
      <meshStandardMaterial
        color={categoryColor[category] ?? "#737373"}
        roughness={0.72}
        emissive={hovered ? "#ffffff" : "#000000"}
        emissiveIntensity={hovered ? 0.16 : 0}
      />
      <Edges color={hovered ? "#f8fafc" : "#111827"} />
    </mesh>
  );
}
function CameraRig({
  view,
  caseSize,
  fitRevision,
  controlsRef,
}: {
  view: TwinView;
  caseSize: Vec3;
  fitRevision: number;
  controlsRef: React.MutableRefObject<OrbitHandle | null>;
}) {
  const { camera } = useThree();
  useEffect(() => {
    const pose = cameraPoseForView(view, caseSize);
    camera.position.set(...pose.position);
    camera.up.set(0, 1, 0);
    camera.lookAt(...pose.target);
    camera.updateProjectionMatrix();
    controlsRef.current?.target.set(...pose.target);
    controlsRef.current?.update();
  }, [camera, view, caseSize[0], caseSize[1], caseSize[2], fitRevision, controlsRef]);
  return null;
}

function MechanicalStatus({
  clearances,
  scene,
}: {
  clearances: ReturnType<typeof measureClearances>;
  scene: ReturnType<typeof buildParametricScene>;
}) {
  const issues = scene.placementIssues.length + scene.collisions.length + clearances.filter((item) => item.status === "FAIL").length;
  const checks = clearances.length + scene.components.length;
  return (
    <details className={`mechanical-status ${issues ? "has-issues" : ""}`}>
      <summary>
        <span>Mechanical · {checks} checks</span>
        <strong>{issues ? `${issues} issue${issues === 1 ? "" : "s"}` : "OK"}</strong>
      </summary>
      <div className="mechanical-details">
        {clearances.map((item) => (
          <div key={item.id} className={`mechanical-row ${item.status.toLowerCase()}`}>
            <span>{item.label}</span>
            <span>{item.requiredMm} / {item.availableMm} mm</span>
            <strong>{item.remainingMm >= 0 ? "+" : ""}{item.remainingMm} mm</strong>
          </div>
        ))}
        {scene.placementIssues.map((issue) => (
          <p key={`${issue.instanceId}-${issue.code}`} className="mechanical-problem">{issue.message}</p>
        ))}
        {scene.collisions.map((collision) => (
          <p key={`${collision.aId}-${collision.bId}`} className="mechanical-problem">{collision.message}</p>
        ))}
        {scene.topologyNotes.map((note) => <p key={note} className="mechanical-note">{note}</p>)}
        <p className="mechanical-honesty">Parametric mounting preview — verified capacities where known; exact component coordinates may differ.</p>
      </div>
    </details>
  );
}
export function DigitalTwin({ products }: { products: readonly ReferenceProduct[] }) {
  const [hovered, setHovered] = useState<SceneBox | null>(null);
  const [view, setView] = useState<TwinView>("ISO");
  const [fitRevision, setFitRevision] = useState(0);
  const [caseVisible, setCaseVisible] = useState(true);
  const controlsRef = useRef<OrbitHandle | null>(null);

  if (!canRenderTwin(products)) {
    return (
      <div className="twin twin-empty">
        <span>Add a case to begin the mechanical preview. You may still choose any other component first.</span>
      </div>
    );
  }

  const scene = buildParametricScene(products);
  const clearances = measureClearances(products);
  const c = scene.caseBox;
  return (
    <div className="twin">
      <TwinToolbar
        view={view}
        caseVisible={caseVisible}
        onView={setView}
        onFit={() => setFitRevision((value) => value + 1)}
        onToggleCase={() => setCaseVisible((value) => !value)}
      />
      <Canvas camera={{ position: [5.5, 4.3, 6.5], fov: 42 }}>
        <CameraRig view={view} caseSize={c.size} fitRevision={fitRevision} controlsRef={controlsRef} />
        <ambientLight intensity={1.4} />
        <directionalLight position={[6, 8, 4]} intensity={2} />
        {caseVisible ? (
          <mesh>
            <boxGeometry args={[c.size[0] / 100, c.size[1] / 100, c.size[2] / 100]} />
            <meshStandardMaterial color="#d4d4d4" transparent opacity={0.08} />
            <Edges color="#737373" />
          </mesh>
        ) : null}
        {scene.components.map((box) => (
          <Box key={box.id} box={box} hovered={hovered?.id === box.id} onHover={setHovered} />
        ))}
        <gridHelper args={[10, 20, "#a3a3a3", "#52525b"]} position={[0, -c.size[1] / 200, 0]} />
        <OrbitControls ref={controlsRef as never} makeDefault />
      </Canvas>
      {hovered ? <div className="hover-readout">{formatHoverLabel(hovered)}</div> : null}
      <MechanicalStatus clearances={clearances} scene={scene} />
      <div className="twin-note">Parametric mechanical preview · dimensions in mm</div>
    </div>
  );
}
