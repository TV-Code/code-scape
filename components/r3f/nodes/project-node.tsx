"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Html } from "@react-three/drei";
import { Mesh, Group, Color, Vector3 } from "three";
import { FileNode } from "@/lib/project-analyzer";

// Enhanced color palette with neon effects
const CATEGORY_COLORS = {
  component: "#00ffff",  // Cyan
  page: "#ff00ff",      // Magenta
  layout: "#00ff88",    // Neon green
  hook: "#ff3366",      // Neon pink
  util: "#ffff00",      // Yellow
  style: "#ff00aa",     // Hot pink
  config: "#88ffff",    // Light cyan
  test: "#00ff00",      // Bright green
  other: "#aaaaff"      // Light purple
};

interface ProjectNodeProps {
  node: FileNode;
  position: [number, number, number];
  scale?: number;
  isHovered?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onHover?: (hovering: boolean) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function ProjectNode({
  node,
  position,
  scale = 1,
  isHovered,
  isSelected,
  onClick,
  onHover
}: ProjectNodeProps) {
  const meshRef = useRef<Mesh>(null);
  const groupRef = useRef<Group>(null);
  const glowRef = useRef<Mesh>(null);

  // Calculate node appearance based on type and size
  const size = node.type === "directory" ? 
    1 + Math.min(node.children?.length || 0, 5) * 0.2 : 
    0.8;

  const baseColor = node.type === "directory" ? 
    "#4a9eff" : 
    CATEGORY_COLORS[node.category] || CATEGORY_COLORS.other;

  // Create glow geometry
  const glowGeometry = useMemo(() => {
    if (node.type === "directory") {
      return <octahedronGeometry args={[1.2]} />;
    }
    return <boxGeometry args={[1.2, 1.2, 1.2]} />;
  }, [node.type]);

  // Animate on hover/select with more complex movement
  useFrame((state, delta) => {
    if (!meshRef.current || !glowRef.current) return;

    // Base floating animation
    const time = state.clock.getElapsedTime();
    const floatY = Math.sin(time * 2) * 0.1;
    
    meshRef.current.position.y = floatY;
    glowRef.current.position.y = floatY;

    // Rotation animation on hover/select
    if (isHovered || isSelected) {
      meshRef.current.rotation.y += delta * 0.5;
      glowRef.current.rotation.y += delta * 0.5;
      
      // Pulse effect
      const pulse = Math.sin(time * 4) * 0.1 + 1;
      meshRef.current.scale.setScalar(pulse * (isHovered ? 1.1 : 1) * size * scale);
      glowRef.current.scale.setScalar(pulse * 1.2 * (isHovered ? 1.15 : 1.05) * size * scale);
    } else {
      // Gentle rotation when idle
      meshRef.current.rotation.y += delta * 0.1;
      glowRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover?.(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover?.(false);
      }}
    >
      {/* Outer glow */}
      <mesh
        ref={glowRef}
        scale={size * scale * 1.2}
      >
        {glowGeometry}
        <meshPhysicalMaterial
          color={baseColor}
          transparent
          opacity={0.3}
          roughness={1}
          metalness={0}
          emissive={new Color(baseColor)}
          emissiveIntensity={isHovered || isSelected ? 2 : 0.5}
        />
      </mesh>

      {/* Main node geometry */}
      <mesh
        ref={meshRef}
        scale={size * scale}
      >
        {node.type === "directory" ? (
          <octahedronGeometry args={[1]} />
        ) : (
          <boxGeometry args={[1, 1, 1]} />
        )}
        <meshPhysicalMaterial
          color={baseColor}
          transparent
          opacity={0.9}
          roughness={0.3}
          metalness={0.8}
          emissive={new Color(baseColor)}
          emissiveIntensity={isHovered || isSelected ? 1 : 0.2}
        />
      </mesh>

      {/* Enhanced text label */}
      <Text
        position={[0, size + 0.5, 0]}
        fontSize={0.4}
        color={isHovered || isSelected ? baseColor : "white"}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.04}
        outlineColor="#000000"
      >
        {node.name}
      </Text>

      {/* Enhanced info panel */}
      {(isHovered || isSelected) && (
        <Html position={[size + 1, 0, 0]}>
          <div className="bg-background/90 backdrop-blur-sm rounded-lg p-3 min-w-[220px] shadow-xl border border-border">
            <div className="text-sm font-medium" style={{ color: baseColor }}>{node.name}</div>
            <div className="text-xs text-muted-foreground mt-2 space-y-1">
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-medium">{node.type}</span>
              </div>
              {node.type === 'directory' && (
                <div className="flex justify-between">
                  <span>Children:</span>
                  <span className="font-medium">{node.children?.length || 0}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Size:</span>
                <span className="font-medium">{formatBytes(node.size)}</span>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}