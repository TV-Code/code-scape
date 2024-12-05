'use client';

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface Connection {
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

export function PlayfulLines({ connections, highlightedNode }: PlayfulLinesProps) {
  return (
    <group>
      {connections.map((connection, index) => {
        const { start, end, from, to } = connection;
        const isHighlighted = highlightedNode && (from === highlightedNode || to === highlightedNode);

        // Create curved path
        const distance = start.distanceTo(end);
        const midPoint = start.clone().add(end).multiplyScalar(0.5);
        const normal = new THREE.Vector3().subVectors(end, start).normalize();
        const binormal = new THREE.Vector3(0, 1, 0);
        const perpendicular = new THREE.Vector3().crossVectors(normal, binormal);

        // Add curve to path
        const curve = new THREE.QuadraticBezierCurve3(
            start,
            midPoint.clone().add(perpendicular.multiplyScalar(distance * 0.2)),
            end
        );

        const points = curve.getPoints(50);

        return (
            <Line
                key={`${from}-${to}-${index}`}
                points={points}
                color={isHighlighted ? '#FF5D9E' : '#4a4a4a'}
                lineWidth={isHighlighted ? 2 : 1}
                opacity={isHighlighted ? 1 : 0.4}
                transparent
                dashed
                dashSize={2}
                dashScale={10}
                gapSize={1}
            />
        );
      })}
    </group>
  );
}