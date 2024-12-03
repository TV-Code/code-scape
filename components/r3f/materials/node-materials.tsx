'use client';

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';

// Shader for pulsing node effect
export const PulsingNodeMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(0.0, 1.0, 1.0),
    pulseSpeed: 1.0,
    pulseIntensity: 0.2,
    glowIntensity: 0.5,
    opacity: 1.0,
    isActive: 1.0,
  },
  // Vertex shader
  `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform float time;
    uniform vec3 color;
    uniform float pulseSpeed;
    uniform float pulseIntensity;
    uniform float glowIntensity;
    uniform float opacity;
    uniform float isActive;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    
    void main() {
      // Calculate rim lighting
      vec3 viewDirection = normalize(cameraPosition - vPosition);
      float rimStrength = 1.0 - max(0.0, dot(viewDirection, vNormal));
      rimStrength = pow(rimStrength, 3.0);
      
      // Pulsing effect
      float pulse = sin(time * pulseSpeed) * 0.5 + 0.5;
      pulse = pulse * pulseIntensity;
      
      // Combine effects
      vec3 glowColor = color + vec3(0.2, 0.2, 0.2) * glowIntensity;
      vec3 finalColor = mix(color, glowColor, rimStrength + pulse);
      
      // Apply active state
      finalColor = mix(finalColor * 0.3, finalColor, isActive);
      
      gl_FragColor = vec4(finalColor, opacity);
    }
  `
);

// Shader for dependency connections
export const FlowingLineMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(0.0, 1.0, 1.0),
    flowSpeed: 1.0,
    flowIntensity: 0.5,
    dashSize: 0.1,
    gapSize: 0.1,
    opacity: 1.0,
  },
  // Vertex shader
  `
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform float time;
    uniform vec3 color;
    uniform float flowSpeed;
    uniform float flowIntensity;
    uniform float dashSize;
    uniform float gapSize;
    uniform float opacity;
    
    varying vec2 vUv;
    
    void main() {
      float flow = fract(vUv.x - time * flowSpeed);
      float dash = step(fract(vUv.x * (1.0 / (dashSize + gapSize))), dashSize / (dashSize + gapSize));
      float intensity = (sin(flow * 3.14159 * 2.0) * 0.5 + 0.5) * flowIntensity;
      
      vec3 finalColor = color * (1.0 + intensity);
      gl_FragColor = vec4(finalColor, opacity * dash);
    }
  `
);

extend({ PulsingNodeMaterial, FlowingLineMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      pulsingNodeMaterial: any;
      flowingLineMaterial: any;
    }
  }
}