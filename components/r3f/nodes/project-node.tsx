"use client";

import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Dodecahedron, Sphere, Torus, Box, Octahedron } from "@react-three/drei";
import { Mesh, Group, Color, Vector3 } from "three";
import { FileNode } from "@/lib/analyzers/project-analyzer";

// Color schemes with meaning
const NODE_COLORS = {
  component: {
    primary: "#00ffdd",    // Cyan for React components
    accent: "#008877"
  },
  page: {
    primary: "#ff00ff",    // Magenta for pages
    accent: "#880088"
  },
  layout: {
    primary: "#4d4dff",    // Blue for layouts
    accent: "#0000aa"
  },
  hook: {
    primary: "#00ff00",    // Green for hooks
    accent: "#008800"
  },
  context: {
    primary: "#ffcc00",    // Gold for context
    accent: "#aa8800"
  },
  api: {
    primary: "#ff4500",    // Orange-Red for API
    accent: "#aa2200"
  },
  style: {
    primary: "#ff1493",    // Pink for styles
    accent: "#aa0066"
  },
  util: {
    primary: "#ffff00",    // Yellow for utilities
    accent: "#aaaa00"
  },
  types: {
    primary: "#dda0dd",    // Plum for types
    accent: "#996699"
  },
  test: {
    primary: "#98fb98",    // Pale green for tests
    accent: "#559955"
  },
  config: {
    primary: "#c0c0c0",    // Silver for config
    accent: "#808080"
  },
  directory: {
    primary: "#4a9eff",    // Blue for directories
    accent: "#2a5999"
  },
  other: {
    primary: "#808080",    // Gray for others
    accent: "#404040"
  }
};

interface ProjectNodeProps {
  node: FileNode;
  position: [number, number, number];
  scale?: number;
  isHovered?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onHover?: (hovering: boolean) => void;
  dependencies?: number;
  dependents?: number;
}

function getNodeGeometry(node: FileNode, importCount: number = 0) {
  const scale = 1 + Math.min(importCount * 0.1, 1);
  
  switch (node.category) {
    case "component":
      return (
        <group>
          <Octahedron args={[scale]}>
            <meshStandardMaterial wireframe />
          </Octahedron>
          <Sphere args={[scale * 0.8, 16, 16]} />
        </group>
      );
    case "page":
      return (
        <group>
          <Box args={[scale * 1.5, scale * 1.5, scale * 0.2]} />
          <Box args={[scale * 1.2, scale * 1.2, scale * 0.1]} position={[0, 0, 0.2]} />
        </group>
      );
    case "hook":
      return <Torus args={[scale * 0.8, scale * 0.2, 16, 32]} rotation={[Math.PI / 2, 0, 0]} />;
    case "directory":
      return <Box args={[scale * 1.2, scale * 1.2, scale * 1.2]} />;
    case "api":
      return <Dodecahedron args={[scale]} />;
    case "util":
      return <Sphere args={[scale * 0.8, 32, 32]} />;
    default:
      return <Sphere args={[scale * 0.8, 16, 16]} />;
  }
}

export function ProjectNode({
  node,
  position,
  scale = 1,
  isHovered,
  isSelected,
  onClick,
  onHover,
  dependencies = 0,
  dependents = 0
}: ProjectNodeProps) {
  const meshRef = useRef<Mesh>(null);
  const groupRef = useRef<Group>(null);

  const colors = NODE_COLORS[node.category] || NODE_COLORS.other;
  const totalConnections = dependencies + dependents;
  const importance = Math.log(totalConnections + 1) * 0.2;

  // Material properties
  const material = useMemo(() => ({
    color: new Color(colors.primary),
    emissive: new Color(colors.accent),
    emissiveIntensity: isHovered || isSelected ? 0.5 : 0.2,
    metalness: 0.8,
    roughness: 0.2,
    transparent: true,
    opacity: isHovered || isSelected ? 1 : 0.8,
  }), [colors, isHovered, isSelected]);

  useFrame((state) => {
    if (!meshRef.current || !groupRef.current) return;

    // Gentle floating based on importance
    const time = state.clock.getElapsedTime();
    const floatHeight = 0.2 + importance;
    groupRef.current.position.y = position[1] + Math.sin(time + position[0]) * floatHeight;

    // Rotation
    if (isHovered || isSelected) {
      meshRef.current.rotation.y += 0.02;
    } else {
      meshRef.current.rotation.y += 0.001 * (1 + importance);
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
      <mesh ref={meshRef} scale={isHovered || isSelected ? scale * 1.1 : scale}>
        {getNodeGeometry(node, totalConnections)}
        <meshPhysicalMaterial {...material} />
      </mesh>

      <Text
        position={[0, 1.2, 0]}
        fontSize={0.4}
        color={colors.primary}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {node.name}
      </Text>

      {(isHovered || isSelected) && (
        <>
          <Text
            position={[0, -1.2, 0]}
            fontSize={0.3}
            color={colors.accent}
            anchorX="center"
            anchorY="middle"
          >
            {`Deps: ${dependencies} | Used by: ${dependents}`}
          </Text>
        </>
      )}
    </group>
  );
}