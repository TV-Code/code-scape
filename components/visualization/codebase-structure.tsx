"use client";

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { FileNode } from '@/lib/redux/features/codebaseSlice';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';

interface CodebaseStructureProps {
  data: FileNode;
  onNodeSelect: (node: FileNode) => void;
}

export function CodebaseStructure({ data, onNodeSelect }: CodebaseStructureProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { layout } = useSelector((state: RootState) => 
    state.codebase.visualizationSettings
  );
  
  // Calculate positions for each node based on layout
  const { nodes, connections } = useMemo(() => {
    const nodes: { node: FileNode; position: THREE.Vector3 }[] = [];
    const connections: { 
      from: THREE.Vector3; 
      to: THREE.Vector3; 
      type: 'structure' | 'dependency' 
    }[] = [];
    
    function calculatePosition(
      node: FileNode, 
      level: number = 0, 
      index: number = 0, 
      totalAtLevel: number = 1
    ): THREE.Vector3 {
      if (layout === 'radial') {
        const angle = (index / totalAtLevel) * Math.PI * 2;
        const radius = level * 4 + 2;
        return new THREE.Vector3(
          Math.cos(angle) * radius,
          -level * 2,
          Math.sin(angle) * radius
        );
      } else if (layout === 'tree') {
        const spacing = 2;
        return new THREE.Vector3(
          (index - totalAtLevel / 2) * spacing,
          -level * 4,
          0
        );
      } else { // force
        // Simple force-directed layout
        const angle = Math.random() * Math.PI * 2;
        const radius = level * 3 + Math.random() * 2;
        return new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          (Math.random() - 0.5) * 10
        );
      }
    }

    function processNode(
      node: FileNode, 
      level: number = 0, 
      parentPos?: THREE.Vector3
    ) {
      const totalAtLevel = node.children?.length || 1;
      const position = calculatePosition(node, level, nodes.length, totalAtLevel);
      nodes.push({ node, position });

      if (parentPos) {
        connections.push({ 
          from: parentPos.clone(), 
          to: position.clone(),
          type: 'structure'
        });
      }

      node.children?.forEach((child, index) => {
        processNode(child, level + 1, position);
      });

      // Add dependency connections
      node.dependencies.forEach(depPath => {
        const depNode = nodes.find(n => n.node.path === depPath);
        if (depNode) {
          connections.push({
            from: position.clone(),
            to: depNode.position.clone(),
            type: 'dependency'
          });
        }
      });
    }

    processNode(data);
    return { nodes, connections };
  }, [data, layout]);

  // Animation
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  const getNodeColor = (node: FileNode): string => {
    if (node.type === 'directory') {
      return '#4a9eff';
    }
    const complexityScale = Math.min(node.complexity / 10, 1);
    return new THREE.Color()
      .setHSL(0.33 * (1 - complexityScale), 0.9, 0.6)
      .getHexString();
  };

  const getNodeSize = (node: FileNode): number => {
    if (node.type === 'directory') {
      return 1 + (node.children?.length || 0) * 0.2;
    }
    const sizeScale = Math.log(node.size + 1) / Math.log(1000);
    const complexityScale = node.complexity / 10;
    return 0.5 + sizeScale * 0.5 + complexityScale * 0.2;
  };

  return (
    <group ref={groupRef}>
      {/* Render nodes */}
      {nodes.map(({ node, position }) => (
        <group key={node.id} position={position}>
          <mesh
            onClick={() => onNodeSelect(node)}
            onPointerOver={(e) => {
              document.body.style.cursor = 'pointer';
              e.stopPropagation();
            }}
            onPointerOut={(e) => {
              document.body.style.cursor = 'default';
              e.stopPropagation();
            }}
          >
            <sphereGeometry args={[getNodeSize(node), 32, 32]} />
            <meshPhongMaterial
              color={`#${getNodeColor(node)}`}
              transparent
              opacity={0.8}
            />
          </mesh>
          
          <Text
            position={[0, getNodeSize(node) + 0.3, 0]}
            fontSize={0.3}
            color="white"
            anchorX="center"
            anchorY="bottom"
          >
            {node.name}
          </Text>
        </group>
      ))}

      {/* Render connections */}
      {connections.map((connection, index) => {
        const points = [connection.from, connection.to];
        return (
          <line key={index}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([
                  connection.from.x, connection.from.y, connection.from.z,
                  connection.to.x, connection.to.y, connection.to.z
                ])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={connection.type === 'dependency' ? '#ff4444' : '#ffffff'}
              transparent
              opacity={connection.type === 'dependency' ? 0.4 : 0.2}
            />
          </line>
        );
      })}
    </group>
  );
}