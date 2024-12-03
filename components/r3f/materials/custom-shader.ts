import * as THREE from 'three';
import { extend } from '@react-three/fiber';

// Create custom shader material for nodes
class CustomNodeMaterial extends THREE.ShaderMaterial {
  _time = 0;
  _color = new THREE.Color(0.0, 1.0, 1.0);
  _pulseSpeed = 1.0;
  _pulseIntensity = 0.2;
  _glowIntensity = 0.5;
  _opacity = 1.0;
  _isActive = 1.0;

  constructor() {
    super({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0.0, 1.0, 1.0) },
        pulseSpeed: { value: 1.0 },
        pulseIntensity: { value: 0.2 },
        glowIntensity: { value: 0.5 },
        opacity: { value: 1.0 },
        isActive: { value: 1.0 }
      },
      vertexShader: `
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
      fragmentShader: `
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
          vec3 viewDirection = normalize(cameraPosition - vPosition);
          float rimStrength = 1.0 - max(0.0, dot(viewDirection, vNormal));
          rimStrength = pow(rimStrength, 3.0);
          
          float pulse = sin(time * pulseSpeed) * 0.5 + 0.5;
          pulse = pulse * pulseIntensity;
          
          vec3 glowColor = color + vec3(0.2, 0.2, 0.2) * glowIntensity;
          vec3 finalColor = mix(color, glowColor, rimStrength + pulse);
          
          finalColor = mix(finalColor * 0.3, finalColor, isActive);
          
          gl_FragColor = vec4(finalColor, opacity);
        }
      `,
      transparent: true,
    });
  }

  get time() { return this._time; }
  set time(v) {
    this._time = v;
    if (this.uniforms) this.uniforms.time.value = v;
  }

  get color() { return this._color; }
  set color(v) {
    this._color = v;
    if (this.uniforms) this.uniforms.color.value = v;
  }

  get pulseSpeed() { return this._pulseSpeed; }
  set pulseSpeed(v) {
    this._pulseSpeed = v;
    if (this.uniforms) this.uniforms.pulseSpeed.value = v;
  }

  get pulseIntensity() { return this._pulseIntensity; }
  set pulseIntensity(v) {
    this._pulseIntensity = v;
    if (this.uniforms) this.uniforms.pulseIntensity.value = v;
  }

  get glowIntensity() { return this._glowIntensity; }
  set glowIntensity(v) {
    this._glowIntensity = v;
    if (this.uniforms) this.uniforms.glowIntensity.value = v;
  }

  get opacity() { return this._opacity; }
  set opacity(v) {
    this._opacity = v;
    if (this.uniforms) this.uniforms.opacity.value = v;
  }

  get isActive() { return this._isActive; }
  set isActive(v) {
    this._isActive = v;
    if (this.uniforms) this.uniforms.isActive.value = v;
  }
}

// Custom shader material for dependency lines
class CustomLineMaterial extends THREE.ShaderMaterial {
  _time = 0;
  _color = new THREE.Color(0.0, 1.0, 1.0);
  _flowSpeed = 1.0;
  _flowIntensity = 0.5;
  _opacity = 1.0;

  constructor() {
    super({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0.0, 1.0, 1.0) },
        flowSpeed: { value: 1.0 },
        flowIntensity: { value: 0.5 },
        opacity: { value: 1.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        uniform float flowSpeed;
        uniform float flowIntensity;
        uniform float opacity;
        
        varying vec2 vUv;
        
        void main() {
          float t = mod(vUv.x - time * flowSpeed, 1.0);
          float flow = smoothstep(0.0, 0.5, t) * (1.0 - smoothstep(0.5, 1.0, t)) * flowIntensity;
          
          vec3 finalColor = color * (1.0 + flow);
          gl_FragColor = vec4(finalColor, opacity);
        }
      `,
      transparent: true,
    });
  }

  get time() { return this._time; }
  set time(v) {
    this._time = v;
    if (this.uniforms) this.uniforms.time.value = v;
  }

  get color() { return this._color; }
  set color(v) {
    this._color = v;
    if (this.uniforms) this.uniforms.color.value = v;
  }

  get flowSpeed() { return this._flowSpeed; }
  set flowSpeed(v) {
    this._flowSpeed = v;
    if (this.uniforms) this.uniforms.flowSpeed.value = v;
  }

  get flowIntensity() { return this._flowIntensity; }
  set flowIntensity(v) {
    this._flowIntensity = v;
    if (this.uniforms) this.uniforms.flowIntensity.value = v;
  }

  get opacity() { return this._opacity; }
  set opacity(v) {
    this._opacity = v;
    if (this.uniforms) this.uniforms.opacity.value = v;
  }
}

extend({ CustomNodeMaterial, CustomLineMaterial });

export { CustomNodeMaterial, CustomLineMaterial };