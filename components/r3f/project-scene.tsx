"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { FileNode } from "@/lib/analyzers/project-analyzer";
import { ProjectNode } from "./nodes/project-node";
import { DependencyLines } from "./nodes/dependency-lines";
import { ForceGraphLayout } from "./layouts/force-graph-layout";
import { Color, Vector3 } from "three";

interface ProjectSceneProps {
  projectData: FileNode;
  onNodeSelect?: (node: FileNode) => void;
}

function Scene({ projectData, onNodeSelect }: ProjectSceneProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState(new Map<string, [number, number, number]>());
  const layoutRef = useRef<ForceGraphLayout>(new ForceGraphLayout());
  const processingRef = useRef(false);

  // Calculate initial node positions only once
  const initialNodePositions = useMemo(() => {
    const positions = new Map<string, [number, number, number]>();

    function processNode(node: FileNode, level: number = 0, angle: number = 0) {
      const radius = 5 + level * 3;
      const position: [number, number, number] = [
        Math.cos(angle) * radius,
        -level * 2,
        Math.sin(angle) * radius
      ];
      positions.set(node.id, position);

      if (node.children) {
        const angleStep = (2 * Math.PI) / node.children.length;
        node.children.forEach((child, index) => {
          processNode(child, level + 1, angle + index * angleStep);
        });
      }
    }

    processNode(projectData);
    return positions;
  }, [projectData]);

  // Initialize positions once
  useEffect(() => {
    if (!processingRef.current) {
      processingRef.current = true;
      setNodePositions(initialNodePositions);
    }
  }, [initialNodePositions]);

  // Create node objects for rendering
  const nodes = useMemo(() => {
    const nodesMap = new Map<string, { node: FileNode; position: [number, number, number] }>();

    function processNode(node: FileNode) {
      const position = nodePositions.get(node.id);
      if (position) {
        nodesMap.set(node.id, { node, position });
      }
      node.children?.forEach(processNode);
    }

    processNode(projectData);
    return Array.from(nodesMap.values());
  }, [projectData, nodePositions]);

  const handleNodeClick = useCallback((node: FileNode) => {
    setSelectedNode(node.id);
    onNodeSelect?.(node);
  }, [onNodeSelect]);

  const handleNodeHover = useCallback((nodeId: string, hovering: boolean) => {
    setHoveredNode(hovering ? nodeId : null);
  }, []);

  return (
    <group>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.4} />

      {nodes.map(({ node, position }) => (
        <ProjectNode
          key={node.id}
          node={node}
          position={position}
          isHovered={hoveredNode === node.id}
          isSelected={selectedNode === node.id}
          onClick={() => handleNodeClick(node)}
          onHover={(hovering) => handleNodeHover(node.id, hovering)}
        />
      ))}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        maxDistance={100}
        minDistance={5}
      />
    </group>
  );
}

export function ProjectScene(props: ProjectSceneProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        gl={{ antialias: true }}
        camera={{ position: [0, 0, 40], fov: 50 }}
        style={{ background: '#0a0a0a' }}
      >
        <Scene {...props} />
      </Canvas>
    </div>
  );
}