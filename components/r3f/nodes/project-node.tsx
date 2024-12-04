'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sphere } from '@react-three/drei';
import { FileNode } from '@/lib/analyzers/project-analyzer';
import { DESIGN_SYSTEM } from '@/lib/design/system';
import { animated, useSpring } from '@react-spring/three';
import * as THREE from 'three';

const AnimatedSphere = animated(Sphere);

interface ProjectNodeProps {
  node: FileNode;
  position: [number, number, number];
  isHovered: boolean;
  isSelected: boolean;
  isRoot: boolean;
  dependencies: number;
  dependents: number;
  onClick: () => void;
  onHover: (hovering: boolean) => void;
}

export function ProjectNode({
  node,
  position,
  isHovered,
  isSelected,
  isRoot,
  dependencies,
  dependents,
  onClick,
  onHover
}: ProjectNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [localHovered, setLocalHovered] = useState(false);
  
  // Calculate size based on importance and type
  const baseSize = isRoot ? 2 : 
                  (dependencies + dependents) / 10 + 0.5; // Size based on connectivity
  
  // Calculate color based on node type
  const getNodeColor = () => {
    if (isRoot) return DESIGN_SYSTEM.colors.root;
    const typeColor = DESIGN_SYSTEM.colors[node.category] || DESIGN_SYSTEM.colors.util;
    return typeColor;
  };

  // Animation springs
  const { scale, pulseIntensity, emissiveIntensity } = useSpring({
    scale: isHovered || isSelected ? [1.2, 1.2, 1.2] : [1, 1, 1],
    pulseIntensity: isHovered || isSelected ? 1 : 0.5,
    emissiveIntensity: isHovered || isSelected ? 0.5 : 0.2,
    config: { mass: 1, tension: 280, friction: 60 }
  });

  // Pulsing animation
  useFrame((state) => {
    if (meshRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.05;
      meshRef.current.scale.setScalar(baseSize * (1 + pulse));
    }
  });

  return (
    <group position={position}>
      <AnimatedSphere
        ref={meshRef}
        args={[baseSize, 32, 32]} // More segments for smoother spheres
        scale={scale}
        onPointerOver={() => {
          setLocalHovered(true);
          onHover(true);
        }}
        onPointerOut={() => {
          setLocalHovered(false);
          onHover(false);
        }}
        onClick={onClick}
      >
        <animated.meshPhysicalMaterial
          color={getNodeColor()}
          metalness={0.2}
          roughness={0.3}
          envMapIntensity={1.5}
          transparent
          opacity={0.9}
          emissive={getNodeColor()}
          emissiveIntensity={emissiveIntensity}
        />
      </AnimatedSphere>

      {/* Node label */}
      <Html
        position={[0, baseSize * 1.2, 0]}
        center
        style={{
          opacity: localHovered || isSelected ? 1 : 0.7,
          transition: 'opacity 0.2s',
          transform: 'scale(1)',
          pointerEvents: 'none'
        }}
      >
        <div className="bg-black/80 text-white px-2 py-1 rounded text-sm whitespace-nowrap">
          {node.name}
        </div>
      </Html>

      {/* Info panel on hover */}
      {(localHovered || isSelected) && (
        <Html
          position={[baseSize * 1.5, 0, 0]}
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '8px',
            borderRadius: '4px',
            color: 'white',
            width: '200px',
            fontSize: '12px',
            pointerEvents: 'none'
          }}
        >
          <div className="flex flex-col gap-1">
            <div className="font-semibold">{node.name}</div>
            <div>Type: {node.category}</div>
            <div>Dependencies: {dependencies}</div>
            <div>Dependents: {dependents}</div>
            {node.size && (
              <div>Size: {(node.size / 1024).toFixed(1)}KB</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}