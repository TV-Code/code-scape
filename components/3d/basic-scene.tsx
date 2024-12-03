'use client';

import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Text } from '@react-three/drei';
import { useRef, useMemo, useState } from 'react';
import { ProjectNode } from './ProjectNode';
import { ConnectionLines } from './ConnectionLines';
import * as THREE from 'three';

function Scene() {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  // Mock project structure - replace with real data
  const projectStructure = useMemo(() => ({
    nodes: [
      { id: 'root', name: 'CodeScape', type: 'directory', position: [0, 0, 0] },
      { id: 'src', name: 'src', type: 'directory', position: [-2, 2, 0] },
      { id: 'components', name: 'components', type: 'directory', position: [2, 2, 0] },
      { id: 'utils', name: 'utils', type: 'directory', position: [0, 4, 0] },
    ],
    connections: [
      { from: 'root', to: 'src' },
      { from: 'root', to: 'components' },
      { from: 'src', to: 'utils' },
      { from: 'components', to: 'utils' },
    ]
  }), []);

  // Handle hover effects
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Ambient camera movement
  useFrame((state) => {
    if (camera && !hoveredNode) {
      camera.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 10;
      camera.position.z = Math.cos(state.clock.elapsedTime * 0.1) * 10;
      camera.lookAt(0, 0, 0);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Retro grid floor */}
      <Grid
        position={[0, -2, 0]}
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#00ff88"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#00ffff"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
      />

      {/* Project structure nodes */}
      {projectStructure.nodes.map((node) => (
        <ProjectNode
          key={node.id}
          position={node.position as [number, number, number]}
          name={node.name}
          type={node.type as 'file' | 'directory'}
          onHover={(hover) => setHoveredNode(hover ? node.id : null)}
          onClick={() => console.log(`Clicked ${node.name}`)}
        />
      ))}

      {/* Connection lines */}
      {projectStructure.connections.map(({ from, to }) => {
        const startNode = projectStructure.nodes.find(n => n.id === from);
        const endNode = projectStructure.nodes.find(n => n.id === to);
        
        if (startNode && endNode) {
          return (
            <ConnectionLines
              key={`${from}-${to}`}
              start={{ x: startNode.position[0], y: startNode.position[1], z: startNode.position[2] }}
              end={{ x: endNode.position[0], y: endNode.position[1], z: endNode.position[2] }}
              color={hoveredNode === from || hoveredNode === to ? '#ff00ff' : '#00ffff'}
              animate={hoveredNode === from || hoveredNode === to}
            />
          );
        }
        return null;
      })}

      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.2} />
      
      {/* Point lights for dramatic effect */}
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#00ffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff00ff" />
      
      {/* Animated spotlight following camera */}
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.5}
        color="#ffffff"
        castShadow
      />
    </group>
  );
}

export default function BasicScene() {
  return (
    <div className="w-full h-full bg-black">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={75} />
        <Scene />
        <OrbitControls
          enableZoom
          enablePan
          enableRotate
          minDistance={5}
          maxDistance={20}
          autoRotate={false}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
