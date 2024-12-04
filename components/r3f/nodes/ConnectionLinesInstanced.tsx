'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

interface Connection {
  start: THREE.Vector3;
  end: THREE.Vector3;
  type: 'import' | 'child' | 'dependency';
}

interface ConnectionLinesInstancedProps {
  connections: Connection[];
}

export function ConnectionLinesInstanced({ connections }: ConnectionLinesInstancedProps) {
  const geometry = useMemo(() => {
    // Create a single buffer for all lines
    const positions: number[] = [];
    const colors: number[] = [];

    connections.forEach(({ start, end, type }) => {
      const distance = start.distanceTo(end);
      const midPoint = start.clone().add(end).multiplyScalar(0.5);
      
      // Calculate control point based on type
      let controlPoint;
      switch (type) {
        case 'child':
          midPoint.y += distance * 0.15;
          controlPoint = midPoint;
          break;
        case 'import':
          midPoint.y += distance * 0.3;
          const perpendicular = new THREE.Vector3()
            .subVectors(end, start)
            .cross(new THREE.Vector3(0, 1, 0))
            .normalize();
          controlPoint = midPoint.clone().add(
            perpendicular.multiplyScalar(distance * 0.2)
          );
          break;
        default:
          midPoint.y += distance * 0.1;
          controlPoint = midPoint;
      }

      // Generate points along the curve
      const curve = new THREE.QuadraticBezierCurve3(start, controlPoint, end);
      const points = curve.getPoints(10); // Reduced from 50 to 10 points for performance

      // Add line segments
      for (let i = 0; i < points.length - 1; i++) {
        positions.push(
          points[i].x, points[i].y, points[i].z,
          points[i + 1].x, points[i + 1].y, points[i + 1].z
        );

        // Set color based on type
        const color = new THREE.Color(
          type === 'child' ? '#2196f3' : 
          type === 'import' ? '#ff9800' : 
          '#4caf50'
        );

        colors.push(
          color.r, color.g, color.b,
          color.r, color.g, color.b
        );
      }
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    return geometry;
  }, [connections]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial vertexColors attach="material" />
    </lineSegments>
  );
}