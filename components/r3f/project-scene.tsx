"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
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
  const { camera } = useThree();
  const cameraTargetRef = useRef(new Vector3());
  const lastUpdateTime = useRef(Date.now());

  // Process the project structure into nodes and links
  const { nodes, links } = useMemo(() => {
    const nodes: Array<{ id: string; node: FileNode }> = [];
    const links: Array<{ source: string; target: string; type: string }> = [];
    
    function processNode(node: FileNode) {
      nodes.push({ id: node.id, node });
      
      // Add imports as links
      if (node.imports?.length) {
        node.imports.forEach(importPath => {
          links.push({ source: node.id, target: importPath, type: 'import' });
        });
      }

      node.children?.forEach(processNode);
    }
    
    processNode(projectData);
    return { nodes, links };
  }, [projectData]);

  // Calculate initial node positions in a spherical layout
  useEffect(() => {
    const newPositions = new Map<string, [number, number, number]>();
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
    
    nodes.forEach(({ id }, i) => {
      const y = 1 - (i / (nodes.length - 1)) * 2; // -1 to 1
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i; // Golden angle increment

      const x = radius * Math.cos(theta) * 20;
      const z = radius * Math.sin(theta) * 20;
      newPositions.set(id, [x, y * 20, z]);
    });

    setNodePositions(newPositions);
  }, [nodes]);

  // Smooth camera behavior
  useFrame((state, delta) => {
    if (hoveredNode || selectedNode) {
      const targetNode = hoveredNode || selectedNode;
      const nodePos = nodePositions.get(targetNode);
      
      if (nodePos && Date.now() - lastUpdateTime.current > 100) {
        const targetPosition = new Vector3(...nodePos).add(new Vector3(5, 2, 5));
        const targetLookAt = new Vector3(...nodePos);
        
        // Smooth camera movement
        camera.position.lerp(targetPosition, delta * 2);
        cameraTargetRef.current.lerp(targetLookAt, delta * 2);
        camera.lookAt(cameraTargetRef.current);
        
        lastUpdateTime.current = Date.now();
      }
    }
  });

  return (
    <>
      <color attach="background" args={['#0a0a0a']} />
      <Stars 
        radius={100} 
        depth={50} 
        count={5000} 
        factor={4} 
        saturation={0} 
        fade 
        speed={1} 
      />
      
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#00ffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff00ff" />
      <pointLight position={[0, 20, 0]} intensity={0.8} color="#ffffff" />

      {/* Dependency Lines */}
      {links.map((link, index) => {
        const startPos = nodePositions.get(link.source);
        const endPos = nodePositions.get(link.target);
        
        if (startPos && endPos) {
          return (
            <DependencyLines
              key={`${link.source}-${link.target}-${index}`}
              start={new Vector3(...startPos)}
              end={new Vector3(...endPos)}
              isHighlighted={
                hoveredNode === link.source || 
                hoveredNode === link.target ||
                selectedNode === link.source ||
                selectedNode === link.target
              }
            />
          );
        }
        return null;
      })}

      {/* Project Nodes */}
      {nodes.map(({ id, node }) => {
        const position = nodePositions.get(id);
        if (!position) return null;

        return (
          <ProjectNode
            key={id}
            node={node}
            position={position}
            isHovered={hoveredNode === id}
            isSelected={selectedNode === id}
            onClick={() => {
              setSelectedNode(prev => prev === id ? null : id);
              onNodeSelect?.(node);
            }}
            onHover={(hovering) => setHoveredNode(hovering ? id : null)}
          />
        );
      })}
      {/* Camera Controls */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        maxDistance={100}
        minDistance={5}
        maxPolarAngle={Math.PI * 0.8}
      />
    </>
  );
}

export function ProjectScene(props: ProjectSceneProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        gl={{ 
          antialias: true,
          alpha: true,
          logarithmicDepthBuffer: true
        }}
        camera={{ 
          position: [0, 0, 40],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
      >
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
