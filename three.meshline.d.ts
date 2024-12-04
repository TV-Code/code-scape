declare module 'three.meshline' {
    import {
      BufferGeometry,
      Material,
      Vector3,
      Texture,
      Mesh,
      Line,
      LineSegments,
      Vector2,
      Color,
      Side,
      Blending,
      ShaderMaterialParameters,
    } from 'three';
  
    export class MeshLine {
      geometry: BufferGeometry;
      isMeshLine: boolean;
      constructor();
      setGeometry(
        geometry: Line | LineSegments | Vector3[] | Float32Array,
        callback?: (p: number) => number
      ): void;
      setVertices(vertices: Vector3[]): void;
      getGeometry(): BufferGeometry;
    }
  
    export interface MeshLineMaterialParameters extends ShaderMaterialParameters {
      useMap?: boolean;
      map?: Texture;
      color?: Color | string | number;
      opacity?: number;
      resolution?: Vector2;
      sizeAttenuation?: boolean;
      lineWidth?: number;
      dashArray?: number;
      dashOffset?: number;
      dashRatio?: number;
      near?: number;
      far?: number;
      depthTest?: boolean;
      blending?: Blending;
      side?: Side;
    }
  
    export class MeshLineMaterial extends Material {
      constructor(parameters?: MeshLineMaterialParameters);
      uniforms: { [uniform: string]: any };
      resolution: Vector2;
      lineWidth: number;
      map: Texture;
      useMap: boolean;
      color: Color;
      opacity: number;
      dashArray: number;
      dashOffset: number;
      dashRatio: number;
      near: number;
      far: number;
      sizeAttenuation: boolean;
      side: Side;
      depthTest: boolean;
      blending: Blending;
    }
  }
  