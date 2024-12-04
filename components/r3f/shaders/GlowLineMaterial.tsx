'use client';

import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

export const GlowLineMaterial = shaderMaterial(
  {
    color: new THREE.Color(0x0000ff),
    linewidth: 0.1,
    opacity: 1.0,
    dashOffset: 0,
    dashScale: 1,
    dashSize: 1,
    gapSize: 1,
    resolution: new THREE.Vector2(1024, 1024),
  },
  // Vertex shader
  `
    uniform float linewidth;
    uniform vec2 resolution;
    
    attribute vec3 instanceStart;
    attribute vec3 instanceEnd;
    attribute vec3 instanceColorStart;
    attribute vec3 instanceColorEnd;
    
    varying vec2 vUv;
    varying vec4 vColor;
    varying float vLineDistance;
    
    void main() {
      float aspect = resolution.x / resolution.y;
      
      // Get position
      vec4 start = modelViewMatrix * vec4(instanceStart, 1.0);
      vec4 end = modelViewMatrix * vec4(instanceEnd, 1.0);
      
      // Calculate line direction and perpendicular
      vec2 dir = normalize((end.xy - start.xy) * vec2(aspect, 1.0));
      vec2 norm = vec2(-dir.y, dir.x);
      
      // Calculate screen-space line width
      float pixelWidth = linewidth * resolution.y;
      vec2 offset = norm * pixelWidth / resolution.y;
      
      // Set position
      vec4 pos = mix(start, end, position.x);
      pos.xy += offset * position.y;
      
      gl_Position = projectionMatrix * pos;
      
      // Pass varyings
      vUv = uv;
      vColor = vec4(mix(instanceColorStart, instanceColorEnd, position.x), 1.0);
      vLineDistance = distance(instanceStart, instanceEnd);
    }
  `,
  // Fragment shader
  `
    uniform vec3 color;
    uniform float opacity;
    uniform float dashScale;
    uniform float dashSize;
    uniform float gapSize;
    uniform float dashOffset;
    
    varying vec2 vUv;
    varying vec4 vColor;
    varying float vLineDistance;
    
    void main() {
      // Calculate radial glow
      float center = 1.0 - pow(abs(vUv.y - 0.5) * 2.0, 2.0);
      
      // Calculate dashes if needed
      float lineU = vUv.x * vLineDistance * dashScale + dashOffset;
      float dash = mod(lineU, dashSize + gapSize);
      float dashAlpha = step(dash, dashSize);
      
      // Apply radial glow and color
      vec3 finalColor = mix(color * 0.5, color, center);
      float finalAlpha = opacity * center * dashAlpha;
      
      // Add bloom contribution
      float bloom = pow(center, 3.0) * 0.5;
      finalColor += color * bloom;
      
      gl_FragColor = vec4(finalColor, finalAlpha);
      
      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }
  `
);

// Add proper extend from THREE.ShaderMaterial
GlowLineMaterial.key = THREE.MathUtils.generateUUID();

// Add type definition
declare global {
  namespace JSX {
    interface IntrinsicElements {
      glowLineMaterial: any;
    }
  }
}