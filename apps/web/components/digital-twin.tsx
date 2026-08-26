"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Edges, OrbitControls } from "@react-three/drei";
import { buildParametricScene, measureClearances, type SceneBox } from "@howtopc/geometry";
import type { ReferenceProduct } from "@howtopc/catalog";
import { canRenderTwin, formatHoverLabel } from "@/lib/viewport";

const categoryColor: Record<string, string> = {
  MOTHERBOARD: "#64748b", GPU: "#2563eb", PSU: "#52525b",
  COOLER: "#0891b2", MEMORY: "#7c3aed", CPU: "#d97706",
  STORAGE: "#059669", NETWORK: "#be123c",
};

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
      <meshStandardMaterial color={categoryColor[category] ?? "#737373"} roughness={0.72}
        emissive={hovered ? "#ffffff" : "#000000"} emissiveIntensity={hovered ? 0.16 : 0} />
      <Edges color={hovered ? "#f8fafc" : "#111827"} />
    </mesh>
  );
}

export function DigitalTwin({ products }: { products: readonly ReferenceProduct[] }) {
  const [hovered, setHovered] = useState<SceneBox | null>(null);
  if (!canRenderTwin(products)) {
    return <div className="twin twin-empty"><span>Install a case to render the mechanical scene.</span></div>;
  }
  const scene = buildParametricScene(products);
  const clearances = measureClearances(products);
  const c = scene.caseBox;
  return (
    <div className="twin">
      <Canvas camera={{ position: [5.5, 4.3, 6.5], fov: 42 }}>
        <ambientLight intensity={1.4} />
        <directionalLight position={[6, 8, 4]} intensity={2} />
        <mesh>
          <boxGeometry args={[c.size[0] / 100, c.size[1] / 100, c.size[2] / 100]} />
          <meshStandardMaterial color="#d4d4d4" transparent opacity={0.08} />
          <Edges color="#737373" />
        </mesh>
        {scene.components.map((box) => <Box key={box.id} box={box} hovered={hovered?.id === box.id} onHover={setHovered} />)}
        <gridHelper args={[10, 20, "#a3a3a3", "#52525b"]} position={[0, -c.size[1] / 200, 0]} />
        <OrbitControls makeDefault />
      </Canvas>
      {hovered ? <div className="hover-readout">{formatHoverLabel(hovered)}</div> : null}
      <div className="clearance-readout">
        {clearances.map((item) => <div key={item.id} className={`clearance-item ${item.status.toLowerCase()}`}><b>{item.label}</b><span>{item.requiredMm} / {item.availableMm} mm</span><strong>{item.remainingMm >= 0 ? "+" : ""}{item.remainingMm} mm</strong></div>)}
      </div>
      <div className="twin-note">Parametric mechanical preview · dimensions in mm</div>
    </div>
  );
}
