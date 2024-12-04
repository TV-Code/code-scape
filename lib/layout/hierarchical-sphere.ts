import { FileNode } from '@/lib/analyzers/project-analyzer';
import * as THREE from 'three';

interface LayoutOptions {
  centerPull: number;      // How strongly nodes are pulled to center (0-1)
  layerDistance: number;   // Base distance between hierarchical layers
  nodeSpacing: number;     // Minimum distance between sibling nodes
  childSpread: number;     // How widely children are distributed
}

const DEFAULT_OPTIONS: LayoutOptions = {
  centerPull: 0.6,
  layerDistance: 5,
  nodeSpacing: 3,
  childSpread: 1.2
};

export class HierarchicalSphereLayout {
  private options: LayoutOptions;
  private positions: Map<string, THREE.Vector3> = new Map();
  private childrenMap: Map<string, FileNode[]> = new Map();
  private nodeDepths: Map<string, number> = new Map();

  constructor(options: Partial<LayoutOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  public layoutNodes(rootNode: FileNode): Map<string, [number, number, number]> {
    this.positions.clear();
    this.childrenMap.clear();
    this.nodeDepths.clear();

    // Build relationships map and calculate depths
    this.analyzeStructure(rootNode);

    // Position nodes
    this.positionNode(rootNode, 0);

    // Apply force-directed adjustments
    this.applyForceDirectedLayout();

    // Convert Vector3 to tuple arrays
    const finalPositions = new Map<string, [number, number, number]>();
    this.positions.forEach((pos, id) => {
      finalPositions.set(id, [pos.x, pos.y, pos.z]);
    });

    return finalPositions;
  }

  private analyzeStructure(node: FileNode, depth: number = 0) {
    this.nodeDepths.set(node.id, depth);

    if (node.children && node.children.length > 0) {
      this.childrenMap.set(node.id, node.children);
      node.children.forEach(child => this.analyzeStructure(child, depth + 1));
    }
  }

  private positionNode(node: FileNode, angle: number) {
    const depth = this.nodeDepths.get(node.id) || 0;
    const children = this.childrenMap.get(node.id) || [];
    
    if (depth === 0) {
      // Root node at center
      this.positions.set(node.id, new THREE.Vector3(0, 0, 0));
    }

    if (children.length > 0) {
      // Position children using Fibonacci sphere distribution
      const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
      const radius = this.options.layerDistance * (depth + 1);

      children.forEach((child, index) => {
        const y = 1 - (index / (children.length - 1)) * 2;
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = phi * index;

        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY;

        // Adjust position based on depth and parent position
        const parentPos = this.positions.get(node.id) || new THREE.Vector3();
        const position = new THREE.Vector3(x, y, z)
          .multiplyScalar(radius * this.options.childSpread)
          .add(parentPos);

        this.positions.set(child.id, position);

        // Recursively position child's children
        this.positionNode(child, theta);
      });
    }
  }

  private applyForceDirectedLayout() {
    const iterations = 50;
    let temperature = 0.1;
    const damping = 0.98;

    for (let i = 0; i < iterations; i++) {
      const forces = new Map<string, THREE.Vector3>();
      const velocities = new Map<string, THREE.Vector3>();

      // Initialize forces for all nodes
      this.positions.forEach((_, id) => {
        forces.set(id, new THREE.Vector3());
        if (!velocities.has(id)) {
          velocities.set(id, new THREE.Vector3());
        }
      });

      // Calculate repulsive forces between nodes
      Array.from(this.positions.entries()).forEach(([id1, pos1], index) => {
        const force = forces.get(id1)!;
        const depth1 = this.nodeDepths.get(id1) || 0;

        // Repulsion from other nodes
        Array.from(this.positions.entries()).slice(index + 1).forEach(([id2, pos2]) => {
          const depth2 = this.nodeDepths.get(id2) || 0;
          const diff = pos1.clone().sub(pos2);
          const distance = diff.length();

          if (distance < this.options.nodeSpacing * (depth1 === depth2 ? 2 : 1)) {
            const repulsion = diff.normalize().multiplyScalar(
              1 / Math.max(distance * distance, 0.1)
            );
            force.add(repulsion);
            forces.get(id2)?.sub(repulsion);
          }
        });

        // Center gravity
        const centerPull = pos1.clone().negate().multiplyScalar(
          this.options.centerPull / Math.max(pos1.length(), 1)
        );
        force.add(centerPull);
      });

      // Apply forces with velocity and damping
      this.positions.forEach((pos, id) => {
        const force = forces.get(id)!;
        const velocity = velocities.get(id)!;
        
        velocity.add(force.multiplyScalar(temperature));
        velocity.multiplyScalar(damping);
        pos.add(velocity);
      });

      temperature *= 0.98;
    }
  }
}