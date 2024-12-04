'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DependencyLinesProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  isHighlighted?: boolean;
  importType?: string;
  opacity?: number;
}

export function DependencyLines({
  start,
  end,
  isHighlighted = false,
  importType = 'import',
  opacity = 0.2
}: DependencyLinesProps) {
  const lineRef = useRef<THREE.Line>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);

  // Create a curved path between points
  const curve = useMemo(() => {
    const midPoint = start.clone().add(end).multiplyScalar(0.5);
    const distance = start.distanceTo(end);
    midPoint.y += distance * 0.2; // Curve upward

    return new THREE.QuadraticBezierCurve3(
      start,
      midPoint,
      end
    );
  }, [start, end]);

  // Generate points along the curve
  const points = useMemo(() => {
    return curve.getPoints(50);
  }, [curve]);

  // Animated dash effect for highlighted lines
  useFrame((state) => {
    if (lineRef.current && materialRef.current && isHighlighted) {
      materialRef.current.dashOffset = state.clock.elapsedTime * (importType === 'import' ? -2 : 2);
    }
  });

  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        ref={materialRef}
        color={isHighlighted ? '#ffd700' : '#4a90e2'}
        transparent
        opacity={opacity}
        linewidth={1}
        dashSize={isHighlighted ? 2 : 0}
        gapSize={isHighlighted ? 1 : 0}
      />
    </line>
  );
}