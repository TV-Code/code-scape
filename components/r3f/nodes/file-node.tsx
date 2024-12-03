"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Html } from "@react-three/drei";
import * as THREE from "three";
import { FileNode } from "@/lib/analyzers/project-analyzer";

// Define colors for different file types
const COLOR_SCHEME = {
  directory: "#4a9eff",
  component: "#61dafb",
  page: "#7c3aed",
  layout: "#2563eb",
  hook: "#10b981",
  api: "#f43f5e",
  util: "#f59e0b",
  style: "#ec4899",
  config: "#6b7280",
  test: "#84cc16",
  types: "#8b5cf6",
  other: "#94a3b8"
};

interface FileNodeMeshProps {
  node: FileNode;
  position: THREE.Vector3;
  scale?: number;
  isHighlighted?: boolean;
  isSelected?: boolean;
  isConnected?: boolean;
  onHover?: (event: THREE.Event, value: boolean) => void;
  onClick?: (event: THREE.Event) => void;
}

export function FileNodeMesh({
  node,
  position,
  scale = 1,
  isHighlighted,
  isSelected,
  isConnected,
  onHover,
  onClick
}: FileNodeMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Calculate node appearance
  const {
    geometry,
    baseColor,
    size,
    glowIntensity
  } = useMemo(() => {
    // Size based on complexity and children
    const baseSize = node.type === 'directory' 
      ? 1 + Math.min(node.children?.length || 0, 5) * 0.2
      : 0.5 + (node.complexity || 0) * 0.1;

    // Color based on category
    const color = new THREE.Color(COLOR_SCHEME[node.category] || COLOR_SCHEME.other);
    
    // Glow intensity based on metrics
    const glow = node.metrics?.maintainabilityIndex 
      ? Math.max(0, 1 - node.metrics.maintainabilityIndex / 100)
      : 0;

    // Geometry based on type
    const geo = node.type === 'directory'
      ? new THREE.OctahedronGeometry(baseSize)
      : new THREE.BoxGeometry(baseSize, baseSize, baseSize);

    return {
      geometry: geo,
      baseColor: color,
      size: baseSize * scale,
      glowIntensity: glow
    };
  }, [node, scale]);

  // Animate on frame
  useFrame((state, delta) => {
    if (meshRef.current) {
      // Hover animation
      if (isHighlighted || isSelected) {
        meshRef.current.rotation.y += delta * 0.5;
        meshRef.current.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.1);
      } else {
        meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }

      // Pulse effect for connected nodes
      if (isConnected) {
        const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1;
        meshRef.current.scale.setScalar(pulse);
      }
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={(e) => onHover?.(e, true)}
        onPointerOut={(e) => onHover?.(e, false)}
      >
        <primitive object={geometry} />
        <meshPhysicalMaterial
          color={baseColor}
          transparent
          opacity={0.8}
          metalness={0.3}
          roughness={0.7}
          emissive={baseColor}
          emissiveIntensity={isHighlighted || isSelected ? 0.5 : glowIntensity}
        />
      </mesh>

      {/* Label */}
      <Text
        position={[0, size + 0.3, 0]}
        fontSize={0.3}
        color={isHighlighted || isSelected ? "white" : "#a0a0a0"}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {node.name}
      </Text>

      {/* Info panel */}
      {(isHighlighted || isSelected) && (
        <Html position={[size + 0.5, 0, 0]}>
          <div className="bg-background/90 backdrop-blur-sm rounded-lg p-3 min-w-[200px] shadow-xl border border-border">
            <div className="text-sm font-medium">{node.name}</div>
            <div className="text-xs text-muted-foreground mt-2 space-y-1">
              <div>Type: {node.category}</div>
              {node.type === 'file' && (
                <>
                  <div>Size: {formatBytes(node.size)}</div>
                  <div>Complexity: {node.complexity}</div>
                  {node.metrics && (
                    <>
                      <div>Lines: {node.metrics.loc}</div>
                      <div>Maintainability: {node.metrics.maintainabilityIndex.toFixed(1)}</div>
                    </>
                  )}
                  {node.componentInfo && (
                    <div className="mt-2">
                      <div className="font-medium">Component Info:</div>
                      <div className="ml-2">
                        <div>Props: {node.componentInfo.props.length}</div>
                        <div>Hooks: {node.componentInfo.hooks.length}</div>
                      </div>
                    </div>
                  )}
                </>
              )}
              {node.type === 'directory' && (
                <>
                  <div>Files: {node.children?.length || 0}</div>
                  <div>Total Size: {formatBytes(node.size)}</div>
                </>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
