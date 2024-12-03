import { FileNode } from "@/lib/analyzers/project-analyzer";
import { Vector3 } from "three";

interface Node {
  id: string;
  position: Vector3;
  velocity: Vector3;
  mass: number;
  importance: number;
  children?: Node[];
  dependencies: string[];
  importers: string[];
}

export class ForceGraphLayout {
  private nodes: Map<string, Node> = new Map();
  private links: Array<{ source: string; target: string }> = [];
  private dimensions: Vector3;
  private centerForce: number = 50;
  private linkDistance: number = 5;
  private repulsionForce: number = 100;
  private importanceForce: number = 30;

  constructor(dimensions: Vector3 = new Vector3(100, 100, 100)) {
    this.dimensions = dimensions;
  }

  initializeFromFileNode(rootNode: FileNode) {
    this.nodes.clear();
    this.links = [];

    const processNode = (node: FileNode, depth: number = 0, parentId?: string) => {
      // Calculate node importance based on dependencies and importers
      const importance = (node.dependencies?.length || 0) + (node.importers?.length || 0);
      
      // Calculate mass based on file size and importance
      const mass = Math.log(node.size + 1) * (1 + importance * 0.2);

      const nodeData: Node = {
        id: node.id,
        position: new Vector3(
          (Math.random() - 0.5) * this.dimensions.x * 0.5,
          (Math.random() - 0.5) * this.dimensions.y * 0.5,
          (Math.random() - 0.5) * this.dimensions.z * 0.5
        ),
        velocity: new Vector3(),
        mass,
        importance,
        dependencies: node.dependencies || [],
        importers: node.importers || []
      };

      this.nodes.set(node.id, nodeData);

      // Create hierarchical links
      if (parentId) {
        this.links.push({ source: parentId, target: node.id });
      }

      // Create dependency links
      if (node.dependencies) {
        node.dependencies.forEach(depId => {
          this.links.push({ source: node.id, target: depId });
        });
      }

      // Process children recursively
      if (node.children) {
        nodeData.children = [];
        node.children.forEach(child => {
          nodeData.children!.push(processNode(child, depth + 1, node.id));
        });
      }

      return nodeData;
    };

    processNode(rootNode);
  }

  update(deltaTime: number) {
    const forces = new Map<string, Vector3>();
    
    // Initialize forces
    this.nodes.forEach((_, id) => {
      forces.set(id, new Vector3());
    });

    // Apply center force
    this.nodes.forEach((node, id) => {
      const force = forces.get(id)!;
      force.sub(node.position).multiplyScalar(this.centerForce / node.position.length());
    });

    // Apply link forces
    this.links.forEach(({ source, target }) => {
      const sourceNode = this.nodes.get(source);
      const targetNode = this.nodes.get(target);
      if (!sourceNode || !targetNode) return;

      const direction = targetNode.position.clone().sub(sourceNode.position);
      const distance = direction.length();
      const strength = (distance - this.linkDistance) * 0.5;
      
      direction.normalize().multiplyScalar(strength);
      forces.get(source)!.add(direction);
      forces.get(target)!.sub(direction);
    });

    // Apply repulsion forces
    this.nodes.forEach((node1, id1) => {
      this.nodes.forEach((node2, id2) => {
        if (id1 === id2) return;

        const direction = node1.position.clone().sub(node2.position);
        const distance = direction.length();
        if (distance < 0.1) return;

        const strength = this.repulsionForce / (distance * distance);
        direction.normalize().multiplyScalar(strength);
        forces.get(id1)!.add(direction);
      });
    });

    // Apply importance-based positioning
    this.nodes.forEach((node, id) => {
      const force = forces.get(id)!;
      const heightForce = new Vector3(0, node.importance * this.importanceForce, 0);
      force.add(heightForce);
    });

    // Update positions
    this.nodes.forEach((node, id) => {
      const force = forces.get(id)!;
      
      // Apply force to velocity
      node.velocity.add(force.multiplyScalar(deltaTime));
      
      // Apply damping
      node.velocity.multiplyScalar(0.95);
      
      // Update position
      node.position.add(node.velocity.clone().multiplyScalar(deltaTime));
    });
  }

  getNodePosition(id: string): Vector3 | undefined {
    return this.nodes.get(id)?.position;
  }

  getNodeImportance(id: string): number {
    return this.nodes.get(id)?.importance || 0;
  }

  getLinks(): Array<{ source: string; target: string }> {
    return this.links;
  }

  setDimensions(dimensions: Vector3) {
    this.dimensions = dimensions;
  }
}