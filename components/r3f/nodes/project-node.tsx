'use client';

import { useRef } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { FileNode } from '@/lib/analyzers/project-analyzer';

interface ProjectNodeProps {
  node: FileNode;
  position: [number, number, number];
  isHovered: boolean;
  isSelected: boolean;
  isUnused?: boolean;
  showLabel?: boolean;
  onClick: () => void;
  onHover: (hovering: boolean) => void;
}

export function ProjectNode({
  node,
  position,
  isHovered,
  isSelected,
  isUnused = false,
  showLabel = true,
  onClick,
  onHover
}: ProjectNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Calculate node color
  const color = isUnused ? '#ff4444' : '#4a90e2';
  
  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => onHover(true)}
        onPointerOut={() => onHover(false)}
        onClick={onClick}
        scale={isHovered || isSelected ? 1.2 : 1}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.2}
          roughness={0.3}
          emissive={isHovered || isSelected ? color : '#000000'}
          emissiveIntensity={0.2}
        />
      </mesh>

      {showLabel && (
        <Html
          position={[0, 1.5, 0]}
          center
          style={{
            opacity: isHovered || isSelected ? 1 : 0.7,
            transition: 'all 0.2s',
            pointerEvents: 'none'
          }}
        >
          <div className="bg-black/80 text-white px-2 py-1 rounded text-sm whitespace-nowrap">
            {node.name}
            {isUnused && (
              <span className="ml-2 text-red-400">(unused)</span>
            )}
          </div>
        </Html>
      )}

      {(isHovered || isSelected) && (
        <Html
          position={[2, 0, 0]}
          center
          style={{
            background: 'rgba(0,0,0,0.8)',
            padding: '8px',
            borderRadius: '4px',
            color: 'white',
            fontSize: '12px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          <div className="flex flex-col gap-1">
            <div>Imports: {node.imports?.length || 0}</div>
            <div>Imported by: {node.importedBy?.length || 0}</div>
            {isUnused && (
              <div className="text-red-400">No connections</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}