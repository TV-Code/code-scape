"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import SimpleBox from "./simple-box";
import { OrbitControls } from "@react-three/drei";

export default function CanvasContainer() {
  return (
    <div className="w-full h-full">
      <Canvas>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <SimpleBox />
          <OrbitControls />
        </Suspense>
      </Canvas>
    </div>
  );
}