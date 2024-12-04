export interface CodeNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  size: number;  // File size or directory total size
  importance: number;  // Calculated metric (0-1)
  metrics: {
    complexity: number;
    dependencies: number;
    changes: number;
    coverage?: number;
  };
  children?: CodeNode[];
  position?: [number, number, number];  // Calculated during layout
  parentId?: string;
}

export interface DependencyLink {
  from: string;
  to: string;
  type: 'import' | 'uses' | 'extends' | 'implements';
  strength: number;  // How often/important this connection is (0-1)
}

export interface ProjectStructure {
  nodes: CodeNode[];
  dependencies: DependencyLink[];
  metadata: {
    totalSize: number;
    maxDepth: number;
    rootNode: string;
  };
}