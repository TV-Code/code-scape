"use client";

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';

// Core material for the central node
export const CentralCoreMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(0.8, 0.6, 1.0),
    pulseSpeed: 0.5,
    glowIntensity: 0.5,
  },
  // Vertex shader
  `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewDirection;
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      vViewDirection = normalize(cameraPosition - worldPosition.xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform float time;
    uniform vec3 color;
    uniform float pulseSpeed;
    uniform float glowIntensity;
    
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewDirection;
    varying vec2 vUv;
    
    void main() {
      // Fresnel effect for edge glow
      float fresnel = pow(1.0 - dot(vNormal, vViewDirection), 3.0);
      
      // Pulsating core
      float pulse = sin(time * pulseSpeed) * 0.5 + 0.5;
      
      // Surface pattern
      float pattern = sin(vUv.x * 20.0 + time) * sin(vUv.y * 20.0 + time) * 0.5 + 0.5;
      
      // Combine effects
      vec3 finalColor = mix(color, color * 1.5, fresnel * glowIntensity);
      finalColor = mix(finalColor, finalColor * 1.3, pattern * pulse);
      
      // Add subtle color variations
      finalColor += vec3(0.1, 0.2, 0.3) * pulse * fresnel;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ CentralCoreMaterial });

// Declare the JSX element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      centralCoreMaterial: any;
    }
  }
}

// Orbital node material
export const OrbitalNodeMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(0.5, 0.8, 1.0),
    pulseSpeed: 0.3,
    glowIntensity: 0.3,
    active: 0.0,
  },
  // Vertex shader
  `
    varying vec3 vNormal;
    varying vec3 vViewDirection;
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vViewDirection = normalize(cameraPosition - worldPosition.xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform float time;
    uniform vec3 color;
    uniform float pulseSpeed;
    uniform float glowIntensity;
    uniform float active;
    
    varying vec3 vNormal;
    varying vec3 vViewDirection;
    varying vec2 vUv;
    
    void main() {
      float fresnel = pow(1.0 - dot(vNormal, vViewDirection), 2.0);
      float pulse = sin(time * pulseSpeed) * 0.5 + 0.5;
      
      // Hexagonal pattern
      vec2 hexUv = vUv * 6.0;
      vec2 gridId = floor(hexUv);
      vec2 gridUv = fract(hexUv);
      float hex = step(abs(gridUv.x - 0.5) + abs(gridUv.y - 0.5), 0.5);
      
      vec3 finalColor = mix(color, color * 1.3, fresnel * glowIntensity);
      finalColor = mix(finalColor, finalColor * 1.2, hex * pulse);
      finalColor += vec3(0.1) * active * pulse;
      
      float opacity = mix(0.7, 1.0, active + fresnel * 0.3);
      
      gl_FragColor = vec4(finalColor, opacity);
    }
  `
);

extend({ OrbitalNodeMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      orbitalNodeMaterial: any;
    }
  }
}