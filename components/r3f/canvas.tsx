"use client";

import { Canvas } from "@react-three/fiber";
import { ReactNode, Suspense } from "react";
import { ACESFilmicToneMapping, LinearSRGBColorSpace } from "three";

export default function R3FCanvas({ children }: { children: ReactNode }) {
  return (
    <div className="h-full w-full">
      <Canvas
        gl={{
          antialias: true,
          toneMapping: ACESFilmicToneMapping,
          outputColorSpace: LinearSRGBColorSpace,
        }}
        camera={{
          fov: 75,
          near: 0.1,
          far: 1000,
          position: [0, 0, 5],
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: '100%',
          pointerEvents: 'auto',
        }}
      >
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </Canvas>
    </div>
  );
}