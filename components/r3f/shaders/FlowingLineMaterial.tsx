'use client';

import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

const FlowingLineMaterial = shaderMaterial(
  {
    color: new THREE.Color(0x4a90e2),
    time: 0,
    dashOffset: 0,
    flowSpeed: 1,
    lineWidth: 1,
    glowIntensity: 1,
    dashScale: 0.5,
    opacity: 1
  },
  // Vertex shader
  `
    varying vec2 vUv;
    uniform float lineWidth;
    
    void main() {
      vUv = uv;
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectedPosition = projectionMatrix * viewPosition;
      gl_Position = projectedPosition;
    }
  `,
  // Fragment shader
  `
    varying vec2 vUv;
    uniform vec3 color;
    uniform float time;
    uniform float dashOffset;
    uniform float flowSpeed;
    uniform float glowIntensity;
    uniform float dashScale;
    uniform float opacity;
    
    void main() {
      // Flowing effect
      float flow = fract(vUv.x * dashScale - time * flowSpeed + dashOffset);
      
      // Smooth line with glow effect
      float line = smoothstep(0.0, 0.1, 1.0 - abs(vUv.y - 0.5) * 2.0);
      float glow = pow(line, 2.0) * glowIntensity;
      
      // Combine effects
      vec3 finalColor = mix(color * 0.5, color, line);
      finalColor += color * glow * 0.5;
      
      // Apply flowing dash pattern
      float dash = smoothstep(0.45, 0.55, flow);
      
      gl_FragColor = vec4(finalColor, opacity * line * dash);
    }
  `
);

// Extend THREE with our custom material
extend({ FlowingLineMaterial });

// Add TypeScript support
declare module '@react-three/fiber' {
  interface ThreeElements {
    flowingLineMaterial: any;
  }
}