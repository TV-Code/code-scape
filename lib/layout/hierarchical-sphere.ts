import { FileNode } from '@/lib/analyzers/project-analyzer';
import * as THREE from 'three';

interface LayoutOptions {
  folderSpacing: number;    // Space between folder bubbles
  fileSpacing: number;      // Space between files within a folder
  filePadding: number;      // Padding between files and folder boundary
}

const DEFAULT_OPTIONS: LayoutOptions = {
  folderSpacing: 40,        // Significantly increased spacing
  fileSpacing: 4,
  filePadding: 3,
};

export class HierarchicalSphereLayout {
  private options: LayoutOptions;
  private positions = new Map<string, [number, number, number]>();
  private folderSizes = new Map<string, number>();

  constructor(options: Partial<LayoutOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  public layoutNodes(rootNode: FileNode): {
    positions: Map<string, [number, number, number]>;
    folderSizes: Map<string, number>;
  } {
    this.positions.clear();
    this.folderSizes.clear();

    // First pass: calculate folder sizes
    this.calculateFolderSizes(rootNode);
    
    // Second pass: position nodes
    this.positionNodes(rootNode, [0, 0, 0], 0);

    return {
      positions: this.positions,
      folderSizes: this.folderSizes
    };
  }

  private calculateFolderSizes(node: FileNode): number {
    if (node.type === 'directory') {
      const fileCount = node.children?.filter(child => child.type === 'file').length || 0;
      
      // Calculate size based on content
      const baseSize = Math.max(
        8,  // Increased minimum size
        Math.sqrt(fileCount) * this.options.fileSpacing + 
        this.options.filePadding * 2
      );
      
      this.folderSizes.set(node.id, baseSize);

      // Process subdirectories
      node.children?.forEach(child => {
        if (child.type === 'directory') {
          this.calculateFolderSizes(child);
        }
      });

      return baseSize;
    }
    return 0;
  }

  private positionNodes(
    node: FileNode, 
    centerPos: [number, number, number],
    depth: number
  ) {
    if (node.type === 'directory') {
      this.positions.set(node.id, centerPos);
      const folderSize = this.folderSizes.get(node.id) || 8;

      // Position contained files in a spiral
      const files = node.children?.filter(child => child.type === 'file') || [];
      const phi = Math.PI * (3 - Math.sqrt(5));
      files.forEach((file, i) => {
        const radius = Math.sqrt(i) * this.options.fileSpacing;
        const theta = i * phi;

        const x = centerPos[0] + radius * Math.cos(theta);
        const y = centerPos[1] + (Math.sin(theta) * radius * 0.3);
        const z = centerPos[2] + radius * Math.sin(theta);

        this.positions.set(file.id, [x, y, z]);
      });

      // Position subdirectories around in a circle
      const subdirs = node.children?.filter(child => child.type === 'directory') || [];
      const angleStep = (2 * Math.PI) / subdirs.length;

      subdirs.forEach((subdir, i) => {
        const angle = angleStep * i;
        const subFolderSize = this.folderSizes.get(subdir.id) || 8;
        const radius = folderSize + subFolderSize + this.options.folderSpacing;
        
        const x = centerPos[0] + Math.cos(angle) * radius;
        const y = centerPos[1] + depth * this.options.folderSpacing * 0.5;
        const z = centerPos[2] + Math.sin(angle) * radius;

        this.positionNodes(subdir, [x, y, z], depth + 1);
      });
    }
  }
}