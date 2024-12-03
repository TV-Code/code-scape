"use client";

import { useState, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Color, Vector3, CatmullRomCurve3, Mesh, TubeGeometry } from "three";
import { CustomLineMaterial } from "../materials/custom-shader";

interface DependencyLinesProps {
  start: Vector3;
  end: Vector3;
  isHighlighted?: boolean;
  importType?: string;
  relationshipStrength?: number;
  isBidirectional?: boolean;
  isCircularDependency?: boolean;
  onHover?: (hovering: boolean) => void;
}

export function DependencyLines({
  start,
  end,
  isHighlighted = false,
  importType = 'default',
  relationshipStrength = 1,
  isBidirectional = false,
  isCircularDependency = false,
  onHover
}: DependencyLinesProps) {
  const [isHovered, setHovered] = useState(false);
  const tubeRef = useRef<Mesh>(null);
  const materialRef = useRef<CustomLineMaterial>();

  // Create curve and geometry
  const { curve, tubeGeometry, middlePoint } = useMemo(() => {
    const distance = start.distanceTo(end);
    const midPoint = new Vector3().addVectors(start, end).multiplyScalar(0.5);
    
    // Add height to the curve based on distance
    const curveHeight = distance * 0.3;
    const sideOffset = distance * 0.15;
    
    // Create control points for a more natural curve
    const controlPoints = [
      start,
      new Vector3().copy(start).lerp(midPoint, 0.25).add(new Vector3(
        Math.random() * sideOffset,
        curveHeight,
        Math.random() * sideOffset
      )),
      new Vector3().copy(midPoint).add(new Vector3(
        0,
        curveHeight * 1.2,
        0
      )),
      new Vector3().copy(end).lerp(midPoint, 0.25).add(new Vector3(
        -Math.random() * sideOffset,
        curveHeight,
        -Math.random() * sideOffset
      )),
      end
    ];

    const curve = new CatmullRomCurve3(controlPoints);
    
    // Create tube geometry with size based on relationship strength
    const tubeGeometry = new TubeGeometry(
      curve,
      64, // tubular segments
      0.02 * (1 + relationshipStrength * 0.5), // tube radius
      8,  // radial segments
      false // closed
    );

    return { curve, tubeGeometry, middlePoint: midPoint };
  }, [start, end, relationshipStrength]);

  // Create material instance
  const material = useMemo(() => {
    const mat = new CustomLineMaterial();
    mat.color = new Color(isCircularDependency ? "#ff0000" : "#4d4dff");
    return mat;
  }, [isCircularDependency]);

  // Animate material
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.time = state.clock.elapsedTime;
      materialRef.current.flowSpeed = isHighlighted || isHovered ? 2 : 1;
      materialRef.current.flowIntensity = isHighlighted || isHovered ? 0.8 : 0.4;
      materialRef.current.opacity = isHighlighted || isHovered ? 1 : 0.6;
    }
  });

  return (
    <group>
      {/* Main connection tube */}
      <mesh
        ref={tubeRef}
        geometry={tubeGeometry}
        onPointerOver={() => {
          setHovered(true);
          onHover?.(true);
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover?.(false);
        }}
      >
        <primitive object={material} ref={materialRef} attach="material" />
      </mesh>

      {/* Bidirectional indicator */}
      {isBidirectional && (
        <mesh position={middlePoint}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial
            color="#00ff00"
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* Information tooltip */}
      {(isHovered || isHighlighted) && (
        <Html position={middlePoint}>
          <div className="bg-black/80 text-white px-2 py-1 rounded text-sm whitespace-nowrap">
            {isCircularDependency ? (
              <span className="text-red-400">Circular Dependency Warning!</span>
            ) : (
              <>
                <div>{isBidirectional ? 'Bidirectional' : 'One-way'} Import</div>
                <div className="text-xs opacity-75">Type: {importType}</div>
              </>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}