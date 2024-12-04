import { CodeNode, ProjectStructure } from '@/types/project-structure';
import * as THREE from 'three';

interface LayoutOptions {
  centerWeight: number;  // How strongly nodes are pulled to center (0-1)
  layerDistance: number;  // Base distance between hierarchical layers
  siblingDistance: number;  // Minimum distance between sibling nodes
  importanceScale: number;  // How much node importance affects positioning
}

const DEFAULT_OPTIONS: LayoutOptions = {
  centerWeight: 0.6,
  layerDistance: 3,
  siblingDistance: 2,
  importanceScale: 1.5
};

export class SphericalLayout {
  private nodes: Map<string, CodeNode> = new Map();
  private childrenMap: Map<string, string[]> = new Map();
  private positions: Map<string, THREE.Vector3> = new Map();
  private options: LayoutOptions;

  constructor(options: Partial<LayoutOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  public layoutProject(structure: ProjectStructure): ProjectStructure {
    this.initialize(structure);
    this.calculateInitialPositions(structure.metadata.rootNode);
    this.applyForceDirectedAdjustments();
    return this.generateUpdatedStructure(structure);
  }

  private initialize(structure: ProjectStructure) {
    this.nodes.clear();
    this.childrenMap.clear();
    this.positions.clear();

    structure.nodes.forEach(node => {
      this.nodes.set(node.id, { ...node });
      if (node.parentId) {
        const siblings = this.childrenMap.get(node.parentId) || [];
        siblings.push(node.id);
        this.childrenMap.set(node.parentId, siblings);
      }
    });
  }

  private calculateInitialPositions(rootId: string, layer: number = 0) {
    const node = this.nodes.get(rootId);
    if (!node) return;

    const children = this.childrenMap.get(rootId) || [];
    
    if (layer === 0) {
      // Root node at center
      this.positions.set(rootId, new THREE.Vector3(0, 0, 0));
    }

    if (children.length > 0) {
      // Position children in a spherical shell around parent
      const radius = this.options.layerDistance * (layer + 1);
      
      // Fibonacci sphere distribution for better spacing
      const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
      
      children.forEach((childId, index) => {
        const childNode = this.nodes.get(childId);
        if (!childNode) return;

        // Calculate fibonacci sphere points
        const y = 1 - (index / (children.length - 1)) * 2;
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = phi * index;
        
        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY;

        // Adjust positions based on importance and layer
        const importanceOffset = childNode.importance * this.options.importanceScale;
        const adjustedRadius = radius * (1 + importanceOffset);
        const position = new THREE.Vector3(x, y, z)
          .multiplyScalar(adjustedRadius);

        this.positions.set(childId, position);

        // Recursively position children
        this.calculateInitialPositions(childId, layer + 1);
      });
    }
  }

  private applyForceDirectedAdjustments() {
    const iterations = 50;
    const temperature = 0.1;
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

      // Calculate forces between all pairs of nodes
      Array.from(this.positions.entries()).forEach(([id1, pos1], index) => {
        const force = forces.get(id1)!;
        const node1 = this.nodes.get(id1)!;

        // Repulsion from other nodes
        Array.from(this.positions.entries()).slice(index + 1).forEach(([id2, pos2]) => {
          const diff = pos1.clone().sub(pos2);
          const distance = diff.length();
          
          if (distance < this.options.siblingDistance) {
            const repulsion = diff.normalize().multiplyScalar(
              1 / Math.max(distance * distance, 0.1)
            );
            force.add(repulsion);
            forces.get(id2)?.sub(repulsion);
          }
        });

        // Attraction to parent
        if (node1.parentId) {
          const parentPos = this.positions.get(node1.parentId);
          if (parentPos) {
            const diff = parentPos.clone().sub(pos1);
            const attraction = diff.multiplyScalar(0.1);
            force.add(attraction);
          }
        }

        // Center gravity
        const centerPull = pos1.clone().negate().multiplyScalar(
          this.options.centerWeight / Math.max(pos1.length(), 1)
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

      // Decay temperature
      temperature *= 0.99;
    }
  }

  private generateUpdatedStructure(structure: ProjectStructure): ProjectStructure {
    const updatedNodes = structure.nodes.map(node => ({
      ...node,
      position: this.positions.get(node.id)?.toArray() as [number, number, number]
    }));

    return {
      ...structure,
      nodes: updatedNodes
    };
  }
}