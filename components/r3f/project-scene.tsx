'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Preload, PerformanceMonitor } from '@react-three/drei';
import { FileNode } from '@/lib/analyzers/project-analyzer';
import { ProjectNode } from './nodes/project-node';
import { ConnectionLines } from './nodes/ConnectionLines';
import { NodeLabel } from './nodes/NodeLabel';
import { CameraController } from './controls/CameraController';
import { HierarchicalSphereLayout } from '@/lib/layout/hierarchical-sphere';
import { EffectComposer, Bloom, Vignette, DepthOfField } from '@react-three/postprocessing';
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
  const [adaptivePerformance, setAdaptivePerformance] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const sceneRef = useRef<THREE.Group>(null);

  // Process project structure
  const { nodes, dependencies, hierarchy } = useMemo(() => {
    const processedNodes = new Map();
    const deps: Array<{ from: string; to: string; type: string }> = [];
    const hier: Array<{ parent: string; child: string }> = [];
    
    function processNode(node: FileNode, parent?: string) {
      processedNodes.set(node.id, {
        ...node,
        dependencies: node.imports?.length || 0,
        dependents: node.importedBy?.length || 0
      });

      // Process imports
      node.imports?.forEach(imp => {
        deps.push({
          from: node.id,
          to: imp,
          type: 'import'
        });
      });

      // Process hierarchy
      if (parent) {
        hier.push({
          parent,
          child: node.id
        });
      }

      // Process children recursively
      node.children?.forEach(child => processNode(child, node.id));
    }

    processNode(projectData);
    return { nodes: processedNodes, dependencies: deps, hierarchy: hier };
  }, [projectData]);

  // Calculate node positions using hierarchical sphere layout
  useEffect(() => {
    const layout = new HierarchicalSphereLayout({
      layerDistance: 10,
      nodeSpacing: 5,
      childSpread: 1.5
    });

    const positions = layout.layoutNodes(projectData);
    setNodePositions(positions);
  }, [projectData]);

  // Handle node selection
  const handleNodeSelect = (nodeId: string, node: FileNode) => {
    setIsAnimating(true);
    setSelectedNode(nodeId === selectedNode ? null : nodeId);
    
    if (nodeId !== selectedNode) {
      onNodeSelect?.(node);
    }
  };

  return (
    <group ref={sceneRef}>
      {/* Environment */}
      <color attach="background" args={[DESIGN_SYSTEM.colors.background]} />
      
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#4a90e2" />
      <spotLight
        position={[0, 30, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.5}
        castShadow
      />

      {/* Hierarchy Connections */}
      {hierarchy.map(({ parent, child }) => {
        const startPos = nodePositions.get(parent);
        const endPos = nodePositions.get(child);
        
        if (startPos && endPos) {
          return (
            <ConnectionLines
              key={`hier-${parent}-${child}`}
              start={new THREE.Vector3(...startPos)}
              end={new THREE.Vector3(...endPos)}
              type="child"
              isHighlighted={hoveredNode === parent || hoveredNode === child}
            />
          );
        }
        return null;
      })}

      {/* Import Dependencies */}
      {dependencies.map(({ from, to, type }) => {
        const startPos = nodePositions.get(from);
        const endPos = nodePositions.get(to);
        
        if (startPos && endPos) {
          return (
            <ConnectionLines
              key={`dep-${from}-${to}`}
              start={new THREE.Vector3(...startPos)}
              end={new THREE.Vector3(...endPos)}
              type="import"
              isHighlighted={hoveredNode === from || hoveredNode === to}
            />
          );
        }
        return null;
      })}

      {/* Nodes */}
      {Array.from(nodes.entries()).map(([id, node]) => {
        const position = nodePositions.get(id);
        if (!position) return null;

        return (
          <group key={id}>
            <ProjectNode
              node={node}
              position={position}
              isHovered={hoveredNode === id}
              isSelected={selectedNode === id}
              isRoot={id === projectData.id}
              dependencies={node.dependencies}
              dependents={node.dependents}
              onClick={() => handleNodeSelect(id, node)}
              onHover={(hovering) => setHoveredNode(hovering ? id : null)}
            />
            <NodeLabel
              node={node}
              baseSize={id === projectData.id ? 2 : 1}
              isHovered={hoveredNode === id}
              isSelected={selectedNode === id}
            />
          </group>
        );
      })}

      {/* Camera Controls */}
      <CameraController
        focusTarget={selectedNode ? nodePositions.get(selectedNode) : undefined}
        isAnimating={isAnimating}
        onAnimationComplete={() => setIsAnimating(false)}
      />

      {/* Post Processing */}
      <EffectComposer enabled={adaptivePerformance > 0.5}>
        <Bloom
          intensity={0.8}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          kernelSize={3}
        />
        <DepthOfField
          focusDistance={0}
          focalLength={0.02}
          bokehScale={2}
          height={480}
        />
        <Vignette
          offset={0.5}
          darkness={0.5}
          eskil={false}
        />
      </EffectComposer>

      {/* Performance Monitoring */}
      <PerformanceMonitor
        onIncline={() => setAdaptivePerformance(Math.min(adaptivePerformance + 0.1, 1))}
        onDecline={() => setAdaptivePerformance(Math.max(adaptivePerformance - 0.1, 0))}
      />
    </group>
  );
}

export function ProjectScene(props: ProjectSceneProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ 
          antialias: true,
          alpha: true,
          logarithmicDepthBuffer: true,
          powerPreference: "high-performance"
        }}
        camera={{ 
          position: [50, 30, 50],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
      >
        <Scene {...props} />
        <Preload all />
      </Canvas>
    </div>
  );
}