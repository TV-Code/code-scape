"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import LoadingSpinner from '../ui/loading-spinner';

function Box() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}

export default function ThreeScene() {
  const [mounted, setMounted] = useState(false);
  const { structure } = useSelector((state: RootState) => state.codebase);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full h-[calc(100vh-4rem)]">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{
          position: [0, 0, 5],
          fov: 75
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Box />
          <OrbitControls />
        </Suspense>
      </Canvas>
    </div>
  );
}