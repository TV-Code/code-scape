'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { FileNode } from '@/lib/analyzers/project-analyzer';
import { ProjectNode } from './nodes/project-node';
import { ConnectionLinesInstanced } from './nodes/ConnectionLinesInstanced';
import { HierarchicalSphereLayout } from '@/lib/layout/hierarchical-sphere';
import { DESIGN_SYSTEM } from '@/lib/design/system';
import * as THREE from 'three';

interface ProjectSceneProps {
  projectData: FileNode;
  onNodeSelect?: (node: FileNode) => void;
}

function Scene({ projectData, onNodeSelect }: ProjectSceneProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState(new Map<string, [number, number, number]>());
  const sceneRef = useRef<THREE.Group>(null);

  // Process project structure
  const { nodes, connections } = useMemo(() => {
    const processedNodes = new Map();
    const allConnections: Array<{
      start: THREE.Vector3;
      end: THREE.Vector3;
      type: 'import' | 'child' | 'dependency';
    }> = [];
    
    function processNode(node: FileNode, parent?: FileNode) {
      processedNodes.set(node.id, {
        ...node,
        dependencies: node.imports?.length || 0,
        dependents: node.importedBy?.length || 0
      });

      // Add parent-child connection if exists
      if (parent) {
        const startPos = nodePositions.get(parent.id);
        const endPos = nodePositions.get(node.id);
        if (startPos && endPos) {
          allConnections.push({
            start: new THREE.Vector3(...startPos),
            end: new THREE.Vector3(...endPos),
            type: 'child'
          });
        }
      }

      // Add import connections
      node.imports?.forEach(imp => {
        const startPos = nodePositions.get(node.id);
        const endPos = nodePositions.get(imp);
        if (startPos && endPos) {
          allConnections.push({
            start: new THREE.Vector3(...startPos),
            end: new THREE.Vector3(...endPos),
            type: 'import'
          });
        }
      });

      // Process children recursively
      node.children?.forEach(child => processNode(child, node));
    }

    processNode(projectData);
    return { nodes: processedNodes, connections: allConnections };
  }, [projectData, nodePositions]);

  // Calculate node positions
  useEffect(() => {
    const layout = new HierarchicalSphereLayout({
      layerDistance: 10,
      nodeSpacing: 5,
      childSpread: 1.5
    });

    const positions = layout.layoutNodes(projectData);
    setNodePositions(positions);
  }, [projectData]);

  return (
    <group ref={sceneRef}>
      {/* Environment */}
      <color attach="background" args={[DESIGN_SYSTEM.colors.background]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />

      {/* Connections */}
      {nodePositions.size > 0 && connections.length > 0 && (
        <ConnectionLinesInstanced connections={connections} />
      )}

      {/* Nodes */}
      {Array.from(nodes.entries()).map(([id, node]) => {
        const position = nodePositions.get(id);
        if (!position) return null;

        return (
          <ProjectNode
            key={id}
            node={node}
            position={position}
            isHovered={hoveredNode === id}
            isSelected={selectedNode === id}
            isRoot={id === projectData.id}
            dependencies={node.dependencies}
            dependents={node.dependents}
            onClick={() => {
              setSelectedNode(id === selectedNode ? null : id);
              onNodeSelect?.(node);
            }}
            onHover={(hovering) => setHoveredNode(hovering ? id : null)}
          />
        );
      })}
    </group>
  );
}

export function ProjectScene(props: ProjectSceneProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{
          position: [50, 30, 50],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
      >
        <Scene {...props} />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          maxDistance={150}
          minDistance={5}
        />
      </Canvas>
    </div>
  );
}