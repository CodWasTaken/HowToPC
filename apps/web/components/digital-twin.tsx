"use client";
import { Canvas } from "@react-three/fiber";
import { Edges, OrbitControls } from "@react-three/drei";
import { buildParametricScene } from "@howtopc/geometry";
import type { ReferenceProduct } from "@howtopc/catalog";
const categoryColor:Record<string,string>={MOTHERBOARD:"#64748b",GPU:"#2563eb",PSU:"#52525b",COOLER:"#0891b2",MEMORY:"#7c3aed",CPU:"#d97706",STORAGE:"#059669",NETWORK:"#be123c"};
function Box({size,position,category}:{size:readonly [number,number,number];position:readonly [number,number,number];category:string}){return <mesh position={[position[0]/100,position[1]/100,position[2]/100]}><boxGeometry args={[size[0]/100,size[1]/100,size[2]/100]}/><meshStandardMaterial color={categoryColor[category]??"#737373"} roughness={0.72}/><Edges color="#111827"/></mesh>;}
export function DigitalTwin({products}:{products:readonly ReferenceProduct[]}){
 const scene=buildParametricScene(products); const c=scene.caseBox;
 return <div className="twin"><Canvas camera={{position:[5.5,4.3,6.5],fov:42}}><ambientLight intensity={1.4}/><directionalLight position={[6,8,4]} intensity={2}/><mesh><boxGeometry args={[c.size[0]/100,c.size[1]/100,c.size[2]/100]}/><meshStandardMaterial color="#d4d4d4" transparent opacity={0.08}/><Edges color="#737373"/></mesh>{scene.components.map(box=><Box key={box.id} size={box.size} position={box.position} category={box.category}/>)}<gridHelper args={[10,20,"#a3a3a3","#e5e5e5"]} position={[0,-2.4,0]}/><OrbitControls makeDefault/></Canvas><div className="twin-note">Parametric mechanical preview · dimensions in mm</div></div>;
}
