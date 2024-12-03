export interface Rotation {
  x: number;
  y: number;
  z: number;
}

export interface CodeNode {
  id: string;
  type: 'file' | 'directory';
  name: string;
  children?: CodeNode[];
  dependencies?: string[];
  size?: number;
}

export interface VisualizationState {
  zoom: number;
  rotation: Rotation;
  selectedNode: string | null;
  codeStructure: CodeNode | null;
}