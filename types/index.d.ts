export interface CodeNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  complexity: number;
  dependencies: string[];
  position: [number, number, number];
  children?: CodeNode[];
}

export interface CodeMetrics {
  complexity: number;
  dependencies: string[];
  issues?: string[];
}

export interface VisualizationSettings {
  zoom: number;
  rotation: [number, number, number];
  layout: 'radial' | 'tree' | 'force';
}