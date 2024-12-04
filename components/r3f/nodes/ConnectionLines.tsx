'use client';

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface ConnectionLinesProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  type: 'import' | 'child' | 'dependency';
  isHighlighted?: boolean;
}

export function ConnectionLines({
  start,
  end,
  type,
  isHighlighted = false
}: ConnectionLinesProps) {
  // Generate curve points
  const points = useMemo(() => {
    const distance = start.distanceTo(end);
    const midPoint = start.clone().add(end).multiplyScalar(0.5);
    let controlPoint;

    switch (type) {
      case 'child':
        // Simple elegant arc for parent-child
        midPoint.y += distance * 0.15;
        controlPoint = midPoint;
        break;
      case 'import':
        // Wider curve for imports
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
        // Subtle curve for dependencies
        midPoint.y += distance * 0.1;
        controlPoint = midPoint;
    }

    // Create smooth curve
    const curve = new THREE.QuadraticBezierCurve3(
      start,
      controlPoint,
      end
    );

    return curve.getPoints(50);
  }, [start, end, type]);

  // Style based on connection type
  const lineStyle = useMemo(() => {
    const styles = {
      child: {
        color: '#2196f3',  // Bright blue
        lineWidth: 3
      },
      import: {
        color: '#ff9800',  // Orange
        lineWidth: 2
      },
      dependency: {
        color: '#4caf50',  // Green
        lineWidth: 2
      }
    };

    return styles[type];
  }, [type]);

  return (
    <Line
      points={points}
      color={lineStyle.color}
      lineWidth={lineStyle.lineWidth}
      dashed={false}
    />
  );
}