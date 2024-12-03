"use client";

import React from 'react';
import { Canvas } from '@react-three/fiber';

interface CanvasWrapperProps {
  children: React.ReactNode;
}

export function CanvasWrapper({ children }: CanvasWrapperProps) {
  return (
    <div className="w-full h-full min-h-[calc(100vh-4rem)]">
      <Canvas
        gl={{ 
          antialias: true,
          alpha: false
        }}
        dpr={[1, 2]}
        camera={{
          fov: 75,
          near: 0.1,
          far: 1000,
          position: [0, 0, 15]
        }}
        style={{
          background: 'rgb(17, 17, 17)'
        }}
      >
        {children}
      </Canvas>
    </div>
  );
}