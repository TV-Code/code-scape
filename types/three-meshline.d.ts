declare module 'three.meshline' {
  import { Material, BufferGeometry, Mesh } from 'three';

  interface MeshLineMaterialParameters {
    lineWidth?: number;
    color?: any;
    opacity?: number;
    resolution?: any;
    sizeAttenuation?: boolean;
    transparent?: boolean;
    blending?: number;
    depthTest?: boolean;
    depthWrite?: boolean;
    dashArray?: number;
    dashOffset?: number;
    dashRatio?: number;
    useMap?: boolean;
    alphaMap?: any;
    useAlphaMap?: boolean;
    alphaTest?: number;
  }

  export class MeshLineMaterial extends Material {
    constructor(parameters?: MeshLineMaterialParameters);
    uniforms: {
      lineWidth: { value: number };
      color: { value: any };
      opacity: { value: number };
      dashArray: { value: number };
      dashOffset: { value: number };
      dashRatio: { value: number };
      resolution: { value: any };
      sizeAttenuation: { value: boolean };
      [key: string]: { value: any };
    };
  }

  export class MeshLineGeometry extends BufferGeometry {
    constructor();
    setPoints(points: number[] | Float32Array): void;
  }

  export class MeshLine extends Mesh {
    constructor();
    setGeometry(g: BufferGeometry | Float32Array | Array<number>, width?: number): void;
  }
}