'use client';

import { useRef, useMemo } from 'react';
import { Vector3, BufferGeometry, LineBasicMaterial, Line } from 'three';
import { useFrame } from '@react-three/fiber';

interface Point {
  x: number;
  y: number;
  z: number;
}

interface ConnectionLinesProps {
  start: Point;
  end: Point;
  color?: string;
  animate?: boolean;
}

export function ConnectionLines({ start, end, color = '#00ffff', animate = true }: ConnectionLinesProps) {
  const lineRef = useRef<Line>(null);

  // Create curved path between points
  const curve = useMemo(() => {
    const startVector = new Vector3(start.x, start.y, start.z);
    const endVector = new Vector3(end.x, end.y, end.z);
    
    // Calculate control point for curve
    const controlPoint = new Vector3(
      (start.x + end.x) * 0.5,
      Math.max(start.y, end.y) + 2,
      (start.z + end.z) * 0.5
    );

    const points = [];
    const segments = 50;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = new Vector3();
      
      // Quadratic bezier curve
      point.x = Math.pow(1 - t, 2) * startVector.x + 
                2 * (1 - t) * t * controlPoint.x + 
                t * t * endVector.x;
      point.y = Math.pow(1 - t, 2) * startVector.y + 
                2 * (1 - t) * t * controlPoint.y + 
                t * t * endVector.y;
      point.z = Math.pow(1 - t, 2) * startVector.z + 
                2 * (1 - t) * t * controlPoint.z + 
                t * t * endVector.z;
                
      points.push(point);
    }

    return points;
  }, [start, end]);

  const geometry = useMemo(() => {
    const geometry = new BufferGeometry().setFromPoints(curve);
    return geometry;
  }, [curve]);

  useFrame((state) => {
    if (lineRef.current && animate) {
      // Animate the line opacity based on time
      const material = lineRef.current.material as LineBasicMaterial;
      material.opacity = (Math.sin(state.clock.elapsedTime * 2) * 0.5 + 0.5) * 0.75 + 0.25;
    }
  });

  return (
    <line ref={lineRef}>
      <bufferGeometry attach="geometry" {...geometry} />
      <lineBasicMaterial 
        attach="material" 
        color={color} 
        transparent 
        linewidth={2}
        opacity={0.75}
      />
    </line>
  );
}
