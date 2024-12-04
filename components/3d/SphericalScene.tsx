'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Effects } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { CodeSphere } from './CodeSphere';
import { SphericalLayout } from '@/lib/layout/spherical-layout';
import { ProjectStructure, CodeNode, DependencyLink } from '@/types/project-structure';

// Custom Effect for smooth edges
const CustomEffects = () => {
  return (
    <Effects>
      <EffectComposer>
        <Bloom 
          intensity={0.5}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.9}
        />
        <Vignette
          darkness={0.5}
          offset={0.1}
        />
      </EffectComposer>
    </Effects>
  );
};

// Curved connection lines between nodes
const DependencyLine = ({ 
  start, 
  end, 
  color = '#ffffff',
  opacity = 0.2,
  animate = false 
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color?: string;
  opacity?: number;
  animate?: boolean;
}) => {
  const ref = useRef<THREE.Line>(null);
  
  const curve = useMemo(() => {
    const midPoint = start.clone().add(end).multiplyScalar(0.5);
    const distance = start.distanceTo(end);
    midPoint.y += distance * 0.2;  // Curve upward
    
    const curve = new THREE.QuadraticBezierCurve3(
      start,
      midPoint,
      end
    );
    
    return curve;
  }, [start, end]);

  const points = useMemo(() => {
    return curve.getPoints(50);
  }, [curve]);

  useFrame((state) => {
    if (ref.current && animate) {
      const material = ref.current.material as THREE.LineBasicMaterial;
      material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  return (
    <line ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial 
        color={color} 
        transparent 
        opacity={opacity}
        linewidth={1}
      />
    </line>
  );
};

interface SceneProps {
  projectData: ProjectStructure;
}

function Scene({ projectData }: SceneProps) {
  const { camera } = useThree();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  
  const layout = useMemo(() => {
    const layoutEngine = new SphericalLayout();
    return layoutEngine.layoutProject(projectData);
  }, [projectData]);

  // Camera animation
  useFrame((state) => {
    if (!selectedNode) {
      // Gentle orbital motion when no node is selected
      const time = state.clock.getElapsedTime() * 0.1;
      camera.position.x = Math.cos(time) * 15;
      camera.position.z = Math.sin(time) * 15;
      camera.position.y = Math.sin(time * 0.5) * 5;
      camera.lookAt(0, 0, 0);
    }
  });

  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.2} />
      
      {/* Main light source */}
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      
      {/* Accent lights */}
      <pointLight position={[-10, -10, -10]} intensity={0.2} color="#0088ff" />
      <pointLight position={[10, -10, 10]} intensity={0.2} color="#ff0088" />

      {/* Node spheres */}
      {layout.nodes.map((node) => (
        <CodeSphere
          key={node.id}
          node={node}
          selected={selectedNode === node.id}
          onHover={(hover) => setHoveredNode(hover ? node.id : null)}
          onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
        />
      ))}

      {/* Dependency connections */}
      {layout.dependencies.map((dep) => {
        const startNode = layout.nodes.find(n => n.id === dep.from);
        const endNode = layout.nodes.find(n => n.id === dep.to);
        
        if (startNode?.position && endNode?.position) {
          const isHighlighted = hoveredNode === dep.from || hoveredNode === dep.to;
          return (
            <DependencyLine
              key={`${dep.from}-${dep.to}`}
              start={new THREE.Vector3(...startNode.position)}
              end={new THREE.Vector3(...endNode.position)}
              color={isHighlighted ? '#ffd700' : '#ffffff'}
              opacity={isHighlighted ? 0.8 : 0.2}
              animate={isHighlighted}
            />
          );
        }
        return null;
      })}

      {/* Post-processing effects */}
      <CustomEffects />
    </>
  );
}

export default function SphericalScene({ projectData }: SceneProps) {
  return (
    <div className="w-full h-full bg-black">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={75} />
        <Scene projectData={projectData} />
        <OrbitControls
          enableZoom
          enablePan
          enableRotate
          minDistance={5}
          maxDistance={30}
          autoRotate={false}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}