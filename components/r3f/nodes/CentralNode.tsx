"use client";

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Text } from '@react-three/drei';
import { Mesh, Group } from 'three';
import { FileNode } from '@/lib/analyzers/project-analyzer';

interface CentralNodeProps {
  node: FileNode;
  size?: number;
  onHover?: (hovering: boolean) => void;
  onClick?: () => void;
}

export function CentralNode({ node, size = 2, onHover, onClick }: CentralNodeProps) {
  const sphereRef = useRef<Mesh>(null);
  const groupRef = useRef<Group>(null);
  const materialRef = useRef<any>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.time = state.clock.getElapsedTime();

      // Pulsating glow intensity
      const pulseBase = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.5 + 0.5;
      materialRef.current.glowIntensity = 0.4 + pulseBase * 0.2;
    }

    if (sphereRef.current) {
      // Gentle constant rotation
      sphereRef.current.rotation.y += 0.001;
      sphereRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Core sphere */}
      <mesh
        ref={sphereRef}
        onClick={onClick}
        onPointerOver={() => onHover?.(true)}
        onPointerOut={() => onHover?.(false)}
      >
        <Sphere args={[size, 64, 64]}>
          <centralCoreMaterial
            ref={materialRef}
            attach="material"
            color="#4a9eff"
            pulseSpeed={0.5}
            glowIntensity={0.5}
          />
        </Sphere>
      </mesh>

      {/* Outer ring */}
      <mesh rotation-x={Math.PI * 0.5}>
        <torusGeometry args={[size * 1.5, 0.05, 16, 100]} />
        <meshPhysicalMaterial
          color="#4a9eff"
          metalness={0.8}
          roughness={0.2}
          opacity={0.4}
          transparent
        />
      </mesh>

      {/* Project name */}
      <Text
        position={[0, size * 1.5, 0]}
        fontSize={0.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {node.name}
      </Text>

      {/* Stats */}
      <Text
        position={[0, -size * 1.5, 0]}
        fontSize={0.3}
        color="#88ccff"
        anchorX="center"
        anchorY="middle"
      >
        {`${node.children?.length || 0} files • ${
          Object.keys(node.imports || {}).length
        } dependencies`}
      </Text>
    </group>
  );
}