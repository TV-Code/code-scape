'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Box } from '@react-three/drei';
import * as THREE from 'three';
import { animated, useSpring } from '@react-spring/three';

interface ProjectNodeProps {
  position: [number, number, number];
  name: string;
  type: 'file' | 'directory';
  size?: number;
  depth?: number;
  onHover?: (hover: boolean) => void;
  onClick?: () => void;
}

export function ProjectNode({ 
  position, 
  name, 
  type, 
  size = 1,
  depth = 0,
  onHover,
  onClick 
}: ProjectNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Animation spring
  const { scale, color } = useSpring({
    scale: hovered ? [1.1, 1.1, 1.1] : [1, 1, 1],
    color: hovered 
      ? type === 'directory' ? '#00ffff' : '#ff00ff'
      : type === 'directory' ? '#0088ff' : '#ff0088',
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

  // Subtle floating animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + depth) * 0.05;
    }
  });

  return (
    <group position={position}>
      <animated.mesh
        ref={meshRef}
        scale={scale}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={onClick}
      >
        <Box args={[size, size, size]}>
          <animated.meshStandardMaterial
            color={color}
            metalness={0.8}
            roughness={0.2}
            emissive={color}
            emissiveIntensity={0.2}
          />
        </Box>
        <Text
          position={[0, size * 0.7, 0]}
          fontSize={0.2}
          color={hovered ? '#ffffff' : '#aaaaaa'}
          anchorX="center"
          anchorY="middle"
        >
          {name}
        </Text>
      </animated.mesh>
    </group>
  );
}
