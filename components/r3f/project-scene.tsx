'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { FileNode } from '@/lib/analyzers/project-analyzer';
import { ProjectNode } from './nodes/project-node';
import { FolderBubble } from './nodes/FolderBubble';
import { Line } from '@react-three/drei';
import { HierarchicalSphereLayout } from '@/lib/layout/hierarchical-sphere';
import { DESIGN_SYSTEM } from '@/lib/design/system';
import * as THREE from 'three';

function Scene({ projectData, onNodeSelect }: { projectData: FileNode; onNodeSelect?: (node: FileNode) => void }) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState(new Map<string, [number, number, number]>());
  const [folderSizes, setFolderSizes] = useState(new Map<string, number>());
  const { camera } = useThree();

  // Process project structure
  const { files, folders, connections } = useMemo(() => {
    const fileNodes = new Map<string, any>();
    const folderNodes = new Map<string, any>();
    const importConnections: Array<{points: THREE.Vector3[]}> = [];

    function processNode(node: FileNode) {
      if (node.type === 'directory') {
        folderNodes.set(node.id, {
          ...node,
          size: folderSizes.get(node.id) || 10
        });
      } else if (node.type === 'file' && (node.path.endsWith('.tsx') || node.path.endsWith('.ts'))) {
        fileNodes.set(node.id, node);
        
        // If this file has imports and we have its position
        if (node.imports && nodePositions.has(node.id)) {
          const sourcePos = nodePositions.get(node.id)!;
          
          node.imports.forEach(importId => {
            if (nodePositions.has(importId)) {
              const targetPos = nodePositions.get(importId)!;
              
              // Create curved path
              const start = new THREE.Vector3(...sourcePos);
              const end = new THREE.Vector3(...targetPos);
              const mid = start.clone().add(end).multiplyScalar(0.5);
              const dist = start.distanceTo(end);
              
              // Add upward curve
              mid.y += dist * 0.2;
              
              // Create smooth curve
              const curve = new THREE.QuadraticBezierCurve3(
                start,
                mid,
                end
              );
              
              importConnections.push({
                points: curve.getPoints(20)
              });
            }
          });
        }
      }

      node.children?.forEach(processNode);
    }

    processNode(projectData);
    return { files: fileNodes, folders: folderNodes, connections: importConnections };
  }, [projectData, nodePositions, folderSizes]);

  // Calculate layout
  useEffect(() => {
    const layout = new HierarchicalSphereLayout();
    const { positions, folderSizes: sizes } = layout.layoutNodes(projectData);
    setNodePositions(positions);
    setFolderSizes(sizes);
  }, [projectData]);

  return (
    <group>
      {/* Environment */}
      <color attach="background" args={[DESIGN_SYSTEM.colors.background]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.6} />

      {/* Import Connections */}
      {connections.map((conn, i) => (
        <Line
          key={i}
          points={conn.points}
          color="#4a90e2"
          lineWidth={1}
          transparent
          opacity={0.4}
        />
      ))}

      {/* Folder Bubbles */}
      {Array.from(folders.entries()).map(([id, folder]) => {
        const position = nodePositions.get(id);
        if (!position) return null;

        return (
          <FolderBubble
            key={id}
            position={position}
            radius={folder.size}
            name={folder.name}
            childCount={(folder.children?.filter(c => c.type === 'file').length || 0)}
            isHovered={hoveredNode === id}
            isSelected={selectedNode === id}
            showLabel
            onHover={(hovering) => setHoveredNode(hovering ? id : null)}
            onClick={() => {
              setSelectedNode(id === selectedNode ? null : id);
              onNodeSelect?.(folder);
            }}
          />
        );
      })}

      {/* File Nodes */}
      {Array.from(files.entries()).map(([id, file]) => {
        const position = nodePositions.get(id);
        if (!position) return null;

        return (
          <ProjectNode
            key={id}
            node={file}
            position={position}
            isHovered={hoveredNode === id}
            isSelected={selectedNode === id}
            isUnused={!file.imports?.length && !file.importedBy?.length}
            showLabel
            onClick={() => {
              setSelectedNode(id === selectedNode ? null : id);
              onNodeSelect?.(file);
            }}
            onHover={(hovering) => setHoveredNode(hovering ? id : null)}
          />
        );
      })}
    </group>
  );
}

export function ProjectScene(props: { projectData: FileNode; onNodeSelect?: (node: FileNode) => void }) {
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