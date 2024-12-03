"use client";

import { Suspense, useEffect, useState } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import dynamic from 'next/dynamic';
import LoadingSpinner from '../ui/loading-spinner';

// Dynamically import canvas wrapper
const CanvasWrapper = dynamic(
  () => import('./canvas-wrapper').then(mod => mod.CanvasWrapper),
  { ssr: false }
);

// Dynamically import three.js content
const CodeStructure = dynamic(
  () => import('./code-structure').then(mod => mod.CodeStructure),
  { ssr: false }
);

export function Scene() {
  const [mounted, setMounted] = useState(false);
  const { zoom, rotation } = useSelector(
    (state: RootState) => state.code.visualizationSettings
  );

  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);

  if (!mounted) {
    return <LoadingSpinner />;
  }

  return (
    <CanvasWrapper>
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <CodeStructure rotation={rotation} />
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05} 
          minDistance={5} 
          maxDistance={50} 
        />
      </Suspense>
    </CanvasWrapper>
  );
}