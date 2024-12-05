'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface FolderBubbleProps {
  position: [number, number, number];
  radius: number;
  name: string;
  isHovered?: boolean;
  isSelected?: boolean;
  childCount: number;
  color?: string;
  showLabel?: boolean;
  onHover?: (hovering: boolean) => void;
  onClick?: () => void;
}

export function FolderBubble({
  position,
  radius,
  name,
  isHovered = false,
  isSelected = false,
  childCount,
  color = '#4a90e2',
  showLabel = true,
  onHover,
  onClick
}: FolderBubbleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Gentle floating animation
  useFrame((state) => {
    if (groupRef.current && !isSelected) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group 
      ref={groupRef} 
      position={position}
      onPointerOver={() => onHover?.(true)}
      onPointerOut={() => onHover?.(false)}
      onClick={onClick}
    >
      {/* Outer glow sphere */}
      <mesh
        ref={glowRef}
        scale={[1.05, 1.05, 1.05]}
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isHovered ? 0.15 : 0.1}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Main bubble */}
      <mesh
        ref={sphereRef}
        scale={isHovered || isSelected ? 1.05 : 1}
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={isHovered ? 0.4 : 0.2}
          metalness={0.2}
          roughness={0.3}
          envMapIntensity={1}
          transmission={0.9}
          thickness={1.5}
          depthWrite={false}
        />
      </mesh>

      {/* Ring effect */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 1.02, 0.02, 16, 100]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isHovered ? 0.4 : 0.2}
        />
      </mesh>

      {/* Labels */}
      {showLabel && (
        <>
          {/* Folder name */}
          <Html
            position={[0, radius + 0.5, 0]}
            center
            style={{
              transition: 'all 0.3s ease',
              opacity: isHovered || isSelected ? 1 : 0.7,
            }}
          >
            <div className="bg-black/80 text-white px-3 py-1.5 rounded-full text-sm font-medium">
              {name}
            </div>
          </Html>

          {/* Info panel on hover */}
          {(isHovered || isSelected) && (
            <Html
              position={[radius + 1, 0, 0]}
              style={{
                background: 'rgba(0,0,0,0.8)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(4px)',
                transform: 'translateX(0)',
                opacity: 1,
                transition: 'all 0.3s ease',
                width: '150px',
              }}
            >
              <div className="flex flex-col gap-2">
                <div className="text-xs font-semibold text-white/60 uppercase tracking-wider">Directory Info</div>
                <div className="text-sm text-white">
                  <div>Files: {childCount}</div>
                  <div>Size: {radius.toFixed(1)} units</div>
                </div>
              </div>
            </Html>
          )}
        </>
      )}
    </group>
  );
}