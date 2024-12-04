import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface ConnectionLinesProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  type: 'import' | 'child' | 'dependency';
  strength?: number;
  isHighlighted?: boolean;
}

export function ConnectionLines({
  start,
  end,
  type,
  strength = 1,
  isHighlighted = false,
}: ConnectionLinesProps) {
  const lineRef = useRef<THREE.Line>();

  // Generate curve path based on connection type
  const { curve, width, color, dashed, dashScale, dashSize, gapSize } = useMemo(() => {
    const distance = start.distanceTo(end);
    const midPoint = start.clone().add(end).multiplyScalar(0.5);
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
        controlPoint = midPoint.clone().add(perpendicular.multiplyScalar(distance * 0.2));
        break;
      default:
        midPoint.y += distance * 0.1;
        controlPoint = midPoint;
    }

    const curvePoints = new THREE.CatmullRomCurve3([start, controlPoint, end]).getPoints(50);

    return {
      curve: curvePoints,
      width: type === 'child' ? 2 : 1,
      color: type === 'child' ? '#4a90e2' : '#ffd700',
      dashed: type === 'import',
      dashScale: 1,
      dashSize: 1,
      gapSize: 1,
    };
  }, [start, end, type]);

  // Animated dash offset
  useFrame((state) => {
    if (lineRef.current && (type === 'import' || isHighlighted)) {
      const material = lineRef.current.material as THREE.LineDashedMaterial;
      material.dashOffset -= 0.01;
    }
  });

  return (
    <Line
      ref={lineRef}
      points={curve}
      color={color}
      lineWidth={width}
      dashed={dashed}
      dashScale={dashScale}
      dashSize={dashSize}
      gapSize={gapSize}
      opacity={isHighlighted ? 0.8 : 0.4}
      transparent
      depthTest={false}
      blending={THREE.AdditiveBlending}
    />
  );
}
