import { Vector3 } from 'three';
import { FileNode } from '@/lib/analyzers/project-analyzer';

export interface LayoutNode {
  id: string;
  position: Vector3;
  scale: number;
  importance: number;
  layer: number;
  district: string;
  connections: string[];
  type: 'core' | 'ui' | 'logic' | 'data' | 'utility';
}

interface District {
  center: Vector3;
  nodes: Set<string>;
  type: 'core' | 'ui' | 'logic' | 'data' | 'utility';
  radius: number;
}

export class ArchitecturalLayout {
  private nodes = new Map<string, LayoutNode>();
  private districts = new Map<string, District>();
  private baseRadius = 40;
  private layerHeight = 15;

  constructor(private data: FileNode) {
    this.initializeLayout();
  }

  private initializeLayout() {
    // Analyze project structure and categorize nodes
    const categories = this.categorizeNodes(this.data);
    
    // Plan districts for different categories
    this.planDistricts(categories);
    
    // Position nodes within their districts
    this.positionNodes(categories);
    
    // Optimize positions to minimize crossing connections
    this.optimizeLayout();
  }

  private categorizeNodes(root: FileNode) {
    const categories = new Map<string, Set<string>>();
    
    const categorize = (node: FileNode) => {
      const type = this.determineNodeType(node);
      if (!categories.has(type)) {
        categories.set(type, new Set());
      }
      categories.get(type)!.add(node.id);
      node.children?.forEach(categorize);
    };

    categorize(root);
    return categories;
  }

  private determineNodeType(node: FileNode): 'core' | 'ui' | 'logic' | 'data' | 'utility' {
    // Core: Pages, layouts, important components
    if (node.category === 'page' || 
        (node.category === 'layout' && node.importedBy?.length > 3)) {
      return 'core';
    }

    // UI: Components, styles, assets
    if (node.category === 'component' || 
        node.category === 'style' ||
        /\.(css|scss|svg|png|jpg)$/.test(node.path)) {
      return 'ui';
    }

    // Logic: Hooks, context, reducers
    if (node.category === 'hook' || 
        node.path.includes('/context/') ||
        node.path.includes('/redux/')) {
      return 'logic';
    }

    // Data: API routes, services, data fetching
    if (node.category === 'api' ||
        node.path.includes('/services/') ||
        node.path.includes('/data/')) {
      return 'data';
    }

    // Utility: Utils, helpers, types
    return 'utility';
  }

  private planDistricts(categories: Map<string, Set<string>>) {
    const districtTypes = ['core', 'ui', 'logic', 'data', 'utility'];
    const angleStep = (Math.PI * 2) / districtTypes.length;

    districtTypes.forEach((type, index) => {
      const nodes = categories.get(type) || new Set();
      const angle = angleStep * index;
      
      // Core district is in the center
      const radius = type === 'core' ? 0 : this.baseRadius;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      this.districts.set(type, {
        center: new Vector3(x, 0, z),
        nodes,
        type: type as any,
        radius: Math.sqrt(nodes.size) * 5
      });
    });
  }

  private positionNodes(categories: Map<string, Set<string>>) {
    categories.forEach((nodes, type) => {
      const district = this.districts.get(type)!;
      const nodesArray = Array.from(nodes);
      
      nodesArray.forEach((nodeId, index) => {
        const node = this.findNode(nodeId);
        if (!node) return;

        // Calculate importance based on connections and complexity
        const importance = this.calculateImportance(node);
        
        // Position within district using golden ratio for even distribution
        const angle = index * Math.PI * (3 - Math.sqrt(5));
        const distanceFromCenter = (index / nodesArray.length) * district.radius;
        
        const x = district.center.x + Math.cos(angle) * distanceFromCenter;
        const z = district.center.z + Math.sin(angle) * distanceFromCenter;
        const y = importance * this.layerHeight;

        this.nodes.set(nodeId, {
          id: nodeId,
          position: new Vector3(x, y, z),
          scale: 0.5 + importance * 0.5,
          importance,
          layer: Math.floor(importance * 3),
          district: type,
          connections: [...(node.dependencies || []), ...(node.importedBy || [])],
          type: district.type
        });
      });
    });
  }

  private optimizeLayout() {
    const iterations = 50;
    const repulsionForce = 1;
    const attractionForce = 0.1;

    for (let i = 0; i < iterations; i++) {
      const forces = new Map<string, Vector3>();
      
      // Initialize forces
      this.nodes.forEach((_, id) => forces.set(id, new Vector3()));
      
      // Apply repulsion between all nodes
      this.nodes.forEach((node1, id1) => {
        this.nodes.forEach((node2, id2) => {
          if (id1 === id2) return;
          
          const diff = node1.position.clone().sub(node2.position);
          const distance = diff.length();
          
          if (distance < 10) {
            const force = diff.normalize().multiplyScalar(repulsionForce / (distance * distance));
            forces.get(id1)!.add(force);
            forces.get(id2)!.sub(force);
          }
        });
      });

      // Apply attraction along connections
      this.nodes.forEach((node, id) => {
        node.connections.forEach(targetId => {
          const targetNode = this.nodes.get(targetId);
          if (!targetNode) return;

          const diff = targetNode.position.clone().sub(node.position);
          const force = diff.multiplyScalar(attractionForce);
          forces.get(id)!.add(force);
        });
      });

      // Update positions while maintaining district constraints
      this.nodes.forEach((node, id) => {
        const force = forces.get(id)!;
        const district = this.districts.get(node.district)!;
        
        // Apply force with district boundary constraint
        const newPos = node.position.clone().add(force);
        const toCenter = newPos.clone().sub(district.center);
        const distance = toCenter.length();
        
        if (distance > district.radius) {
          toCenter.normalize().multiplyScalar(district.radius);
          newPos.copy(district.center).add(toCenter);
        }

        // Maintain y-position based on layer
        newPos.y = node.layer * this.layerHeight;
        
        node.position.copy(newPos);
      });
    }
  }

  private findNode(id: string): FileNode | null {
    const search = (node: FileNode): FileNode | null => {
      if (node.id === id) return node;
      for (const child of node.children || []) {
        const found = search(child);
        if (found) return found;
      }
      return null;
    };
    return search(this.data);
  }

  private calculateImportance(node: FileNode): number {
    const dependencyCount = node.dependencies?.length || 0;
    const importerCount = node.importedBy?.length || 0;
    const complexity = node.complexity || 1;
    
    return (Math.log2(1 + dependencyCount + importerCount) * complexity) / 15;
  }

  // Public methods
  getNodePosition(id: string): LayoutNode | undefined {
    return this.nodes.get(id);
  }

  getDistricts(): Map<string, District> {
    return this.districts;
  }

  getConnections(): Array<{ from: string; to: string; strength: number }> {
    const connections: Array<{ from: string; to: string; strength: number }> = [];
    
    this.nodes.forEach((node, fromId) => {
      node.connections.forEach(toId => {
        if (this.nodes.has(toId)) {
          const fromNode = this.findNode(fromId);
          const toNode = this.findNode(toId);
          if (!fromNode || !toNode) return;

          const strength = Math.min(
            fromNode.complexity / 10 + toNode.complexity / 10,
            1
          );

          connections.push({ from: fromId, to: toId, strength });
        }
      });
    });

    return connections;
  }
}
