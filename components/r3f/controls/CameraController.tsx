'use client';

import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

interface CameraControllerProps {
  focusTarget?: [number, number, number];
  isAnimating?: boolean;
  onAnimationComplete?: () => void;
}

export function CameraController({
  focusTarget,
  isAnimating,
  onAnimationComplete
}: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControls>();

  // Handle focus target changes with smooth animation
  useEffect(() => {
    if (focusTarget && controlsRef.current) {
      const controls = controlsRef.current;
      const targetPosition = new THREE.Vector3(...focusTarget);
      const distance = 15;

      // Calculate current viewing angle
      const currentAngle = Math.atan2(
        camera.position.z - controls.target.z,
        camera.position.x - controls.target.x
      );

      // Maintain relative camera angle during transition
      const offset = new THREE.Vector3(
        Math.cos(currentAngle) * distance,
        distance * 0.5,
        Math.sin(currentAngle) * distance
      );

      const cameraTarget = targetPosition.clone().add(offset);

      // Smoothly animate both camera and controls
      gsap.timeline()
        .to(camera.position, {
          x: cameraTarget.x,
          y: cameraTarget.y,
          z: cameraTarget.z,
          duration: 1.2,
          ease: "power3.inOut",
        })
        .to(controls.target, {
          x: targetPosition.x,
          y: targetPosition.y,
          z: targetPosition.z,
          duration: 1.2,
          ease: "power3.inOut",
          onUpdate: () => controls.update(),
          onComplete: () => {
            onAnimationComplete?.();
            controls.update();
          }
        }, "<");
    }
  }, [focusTarget, camera, onAnimationComplete]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.05}
      maxDistance={150}
      minDistance={5}
      maxPolarAngle={Math.PI * 0.85}
      enablePan={!isAnimating}
      enableZoom={!isAnimating}
      enableRotate={!isAnimating}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
      target={new THREE.Vector3(0, 0, 0)}
    />
  );
}