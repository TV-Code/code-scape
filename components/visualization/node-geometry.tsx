"use client";

import { useRef, useEffect } from 'react';
import { Mesh, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { CodeNode } from '@/lib/visualization/types';

interface NodeGeometryProps {
  node: CodeNode;
  position: Vector3;
  scale?: number;
  onClick?: () => void;
  isSelected?: boolean;
}

export function NodeGeometry({ 
  node, 
  position, 
  scale = 1, 
  onClick,
  isSelected = false 
}: NodeGeometryProps) {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && isSelected) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  const getNodeColor = () => {
    if (isSelected) return "#00ff00";
    switch (node.type) {
      case 'directory':
        return "#4a9eff";
      case 'file':
        return "#ff9000";
      default:
        return "#ffffff";
    }
  };

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={[scale, scale, scale]}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {node.type === 'directory' ? (
        <octahedronGeometry args={[1]} />
      ) : (
        <boxGeometry args={[1, 1, 1]} />
      )}
      <meshStandardMaterial
        color={getNodeColor()}
        wireframe={isSelected}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}