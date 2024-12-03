"use client";

import { useRef, useMemo, useState } from "react";
import * as THREE from "three";
import { OrbitControls, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";

// Component to visualize a file/directory node
function Node({ 
  position, 
  size, 
  color, 
  name, 
  isHovered,
  onClick,
  onHover 
}: { 
  position: [number, number, number];
  size: number;
  color: string;
  name: string;
  isHovered?: boolean;
  onClick?: () => void;
  onHover?: (hovering: boolean) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current && isHovered) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => onHover?.(true)}
        onPointerOut={() => onHover?.(false)}
      >
        <boxGeometry args={[size, size, size]} />
        <meshPhongMaterial 
          color={color} 
          transparent 
          opacity={0.8}
          emissive={isHovered ? color : undefined}
          emissiveIntensity={isHovered ? 0.5 : 0}
        />
      </mesh>
      <Text
        position={[0, size + 0.2, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="bottom"
      >
        {name}
      </Text>
    </group>
  );
}

// Connection lines between nodes
function DependencyLines({ connections }: { 
  connections: Array<{ 
    start: [number, number, number]; 
    end: [number, number, number];
    strength: number;
  }> 
}) {
  return (
    <group>
      {connections.map((connection, index) => {
        const points = [
          new THREE.Vector3(...connection.start),
          new THREE.Vector3(...connection.end)
        ];

        return (
          <line key={index}>
            <bufferGeometry>
              <float32BufferAttribute
                attach="attributes-position"
                args={[new Float32Array(points.flatMap(p => [p.x, p.y, p.z])), 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color="#4a9eff"
              transparent
              opacity={connection.strength * 0.5}
              linewidth={connection.strength}
            />
          </line>
        );
      })}
    </group>
  );
}

// Calculate positions for hierarchical layout
function calculateNodePositions(node: any, level = 0, angle = 0, radius = 10) {
  const result = [];
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const y = -level * 3;

  result.push({
    id: node.id,
    position: [x, y, z],
    size: node.type === 'directory' ? 1 + (node.children?.length || 0) * 0.2 : 1,
    color: node.type === 'directory' ? '#4a9eff' : '#50d71e',
    name: node.name
  });

  if (node.children) {
    const angleStep = (2 * Math.PI) / node.children.length;
    node.children.forEach((child: any, index: number) => {
      const childAngle = angle + index * angleStep;
      const childPositions = calculateNodePositions(
        child,
        level + 1,
        childAngle,
        radius * 0.8
      );
      result.push(...childPositions);
    });
  }

  return result;
}

export default function Scene() {
  const { structure } = useSelector((state: RootState) => state.codebase);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Calculate node positions and connections
  const { nodes, connections } = useMemo(() => {
    if (!structure) return { nodes: [], connections: [] };

    const nodes = calculateNodePositions(structure);
    const connections: any[] = []; // Calculate your connections here

    return { nodes, connections };
  }, [structure]);

  if (!structure) return null;

  return (
    <>
      <OrbitControls 
        enableDamping 
        dampingFactor={0.05} 
        rotateSpeed={0.5} 
      />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <hemisphereLight
        position={[0, 20, 0]}
        intensity={0.5}
        groundColor={new THREE.Color("#000000")}
      />
      
      {nodes.map((node) => (
        <Node
          key={node.id}
          {...node}
          isHovered={hoveredNode === node.id}
          onHover={(hovered) => setHoveredNode(hovered ? node.id : null)}
          onClick={() => {
            // Handle node click
            console.log('Clicked nodes:', node);
          }}
        />
      ))}
      
      <DependencyLines connections={connections} />
    </>
  );
}