'use client';

import * as THREE from 'three';
import { useRef } from 'react';
import { LineBasicMaterial, Line2 } from 'three/examples/jsm/lines/Line2';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';

interface ConnectionLinesProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
}

export function ConnectionLines({ start, end }: ConnectionLinesProps) {
  const lineRef = useRef<any>();

  // Create a curved path between points
  const midPoint = start.clone().add(end).multiplyScalar(0.5);
  const distance = start.distanceTo(end);
  midPoint.y += distance * 0.2;

  const curve = new THREE.QuadraticBezierCurve3(
    start,
    midPoint,
    end
  );

  // Get points along the curve
  const points = curve.getPoints(50);
  const positions = points.flatMap(p => [p.x, p.y, p.z]);

  return (
    <group>
      {/* Debug points */}
      <mesh position={start}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color="yellow" />
      </mesh>
      <mesh position={end}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color="green" />
      </mesh>

      {/* The actual line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={new Float32Array(positions)}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#4a90e2"
          linewidth={1}
          transparent
          opacity={0.6}
        />
      </line>
    </group>
  );
}