'use client';

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useState, useRef } from 'react';

export interface Connection {
  from: string;
  to: string;
  start: THREE.Vector3;
  end: THREE.Vector3;
  type: 'import';
}

interface PlayfulLinesProps {
  connections: Connection[];
  highlightedNode?: string | null;
}

const COLORS = ['#4a90e2', '#ff6b6b', '#50e3c2', '#f8c744', '#b8e986'];

export function PlayfulLines({ connections, highlightedNode }: PlayfulLinesProps) {
  const linesRef = useRef<THREE.Group>(null);
  const [time, setTime] = useState(0);

  // Animate lines
  useFrame((state) => {
    setTime(state.clock.getElapsedTime());
    if (linesRef.current) {
      linesRef.current.rotation.y = Math.sin(time * 0.1) * 0.02;
    }
  });

  const connectionLines = useMemo(() => {
    return connections.map((connection, index) => {
      const { start, end, from, to } = connection;
      const isHighlighted = highlightedNode && (from === highlightedNode || to === highlightedNode);
      const baseColor = COLORS[index % COLORS.length];

      // Create multiple control points for more organic curves
      const distance = start.distanceTo(end);
      const midPoint = start.clone().add(end).multiplyScalar(0.5);
      const normal = new THREE.Vector3().subVectors(end, start).normalize();
      const binormal = new THREE.Vector3(0, 1, 0);
      const perpendicular = new THREE.Vector3().crossVectors(normal, binormal);

      // Create random offsets for control points
      const randomOffset = Math.random() * distance * 0.3;
      const controlPoint1 = midPoint.clone()
        .add(perpendicular.clone().multiplyScalar(randomOffset))
        .add(new THREE.Vector3(0, distance * 0.2, 0));
      
      const controlPoint2 = midPoint.clone()
        .add(perpendicular.clone().multiplyScalar(-randomOffset))
        .add(new THREE.Vector3(0, distance * 0.3, 0));

      // Create a more complex curve
      const curve = new THREE.CubicBezierCurve3(
        start,
        controlPoint1,
        controlPoint2,
        end
      );

      const points = curve.getPoints(50);

      return {
        points,
        color: isHighlighted ? '#FF5D9E' : baseColor,
        width: isHighlighted ? 2 : 1,
        opacity: isHighlighted ? 1 : 0.6,
        dashOffset: -time * (index % 2 ? 1 : -1), // Animate dash offset in different directions
      };
    });
  }, [connections, highlightedNode, time]);

  return (
    <group ref={linesRef}>
      {connectionLines.map((line, index) => (
        <Line
          key={`connection-${index}`}
          points={line.points}
          color={line.color}
          lineWidth={line.width}
          opacity={line.opacity}
          transparent
          dashed
          dashScale={2}
          dashSize={2}
          gapSize={1}
          dashOffset={line.dashOffset}
        />
      ))}
    </group>
  );
}