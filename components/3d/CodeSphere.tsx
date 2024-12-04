'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
import { animated, useSpring } from '@react-spring/three';
import { CodeNode } from '@/types/project-structure';

interface CodeSphereProps {
  node: CodeNode;
  onHover?: (hover: boolean) => void;
  onClick?: () => void;
  selected?: boolean;
}

export function CodeSphere({ 
  node,
  onHover,
  onClick,
  selected = false
}: CodeSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Calculate sphere size based on importance
  const baseSize = 0.5 + (node.importance * 1.5);
  
  // Animation spring
  const { scale, color, emissiveIntensity } = useSpring({
    scale: hovered ? [1.1, 1.1, 1.1] : selected ? [1.05, 1.05, 1.05] : [1, 1, 1],
    color: hovered 
      ? '#ffd700'  // Gold when hovered
      : selected 
        ? '#00ffff'  // Cyan when selected
        : node.type === 'directory' ? '#4a90e2' : '#e24a90',  // Blue for directories, Pink for files
    emissiveIntensity: hovered ? 0.5 : selected ? 0.3 : 0.1,
    config: { mass: 1, tension: 280, friction: 60 }
  });

  // Hover effects
  const handlePointerOver = () => {
    setHovered(true);
    onHover?.(true);
  };

  const handlePointerOut = () => {
    setHovered(false);
    onHover?.(false);
  };

  // Subtle pulsing animation
  useFrame((state) => {
    if (meshRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.03;
      meshRef.current.scale.setScalar(baseSize * (1 + pulse));
    }
  });

  return (
    <group position={node.position || [0, 0, 0]}>
      <animated.mesh
        ref={meshRef}
        scale={scale}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={onClick}
      >
        <Sphere args={[baseSize, 32, 32]}>
          <animated.meshPhysicalMaterial
            color={color}
            metalness={0.2}
            roughness={0.3}
            emissive={color}
            emissiveIntensity={emissiveIntensity}
            transparent
            opacity={0.9}
            envMapIntensity={1}
          />
        </Sphere>

        {/* File/Directory name */}
        <Text
          position={[0, baseSize * 1.2, 0]}
          fontSize={0.15}
          color={hovered ? '#ffffff' : '#aaaaaa'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {node.name}
        </Text>

        {/* Metrics display on hover */}
        {(hovered || selected) && (
          <Html
            position={[baseSize * 1.2, 0, 0]}
            style={{
              width: '150px',
              padding: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '12px',
              pointerEvents: 'none'
            }}
          >
            <div>
              <div>Complexity: {node.metrics.complexity.toFixed(1)}</div>
              <div>Dependencies: {node.metrics.dependencies}</div>
              <div>Changes: {node.metrics.changes}</div>
              {node.metrics.coverage !== undefined && (
                <div>Coverage: {node.metrics.coverage}%</div>
              )}
            </div>
          </Html>
        )}
      </animated.mesh>
    </group>
  );
}