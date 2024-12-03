type Vec3 = [number, number, number];
type Node = {
  id: string;
  position: Vec3;
  velocity: Vec3;
  mass: number;
};

export class ForceGraphLayout {
  private nodes: Map<string, Node> = new Map();
  private links: Array<{ source: string; target: string; strength: number }> = [];
  private centerForce = 0.1;
  private repulsionForce = 1;
  private linkForce = 0.5;

  addNode(id: string, initialPosition: Vec3, mass: number = 1) {
    this.nodes.set(id, {
      id,
      position: initialPosition,
      velocity: [0, 0, 0],
      mass
    });
  }

  addLink(sourceId: string, targetId: string, strength: number = 1) {
    this.links.push({ source: sourceId, target: targetId, strength });
  }

  private applyForces() {
    // Center force
    for (const node of this.nodes.values()) {
      const dist = Math.sqrt(
        node.position[0] ** 2 + 
        node.position[1] ** 2 + 
        node.position[2] ** 2
      );
      if (dist > 0) {
        const force = -this.centerForce * dist;
        node.velocity[0] += (force * node.position[0]) / dist;
        node.velocity[1] += (force * node.position[1]) / dist;
        node.velocity[2] += (force * node.position[2]) / dist;
      }
    }

    // Repulsion between nodes
    for (const node1 of this.nodes.values()) {
      for (const node2 of this.nodes.values()) {
        if (node1.id === node2.id) continue;

        const dx = node2.position[0] - node1.position[0];
        const dy = node2.position[1] - node1.position[1];
        const dz = node2.position[2] - node1.position[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist > 0) {
          const force = -this.repulsionForce / (dist * dist);
          const fx = (force * dx) / dist;
          const fy = (force * dy) / dist;
          const fz = (force * dz) / dist;

          node1.velocity[0] -= fx;
          node1.velocity[1] -= fy;
          node1.velocity[2] -= fz;
          node2.velocity[0] += fx;
          node2.velocity[1] += fy;
          node2.velocity[2] += fz;
        }
      }
    }

    // Link forces
    for (const link of this.links) {
      const source = this.nodes.get(link.source);
      const target = this.nodes.get(link.target);
      if (!source || !target) continue;

      const dx = target.position[0] - source.position[0];
      const dy = target.position[1] - source.position[1];
      const dz = target.position[2] - source.position[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist > 0) {
        const force = this.linkForce * link.strength * (dist - 2);
        const fx = (force * dx) / dist;
        const fy = (force * dy) / dist;
        const fz = (force * dz) / dist;

        source.velocity[0] += fx;
        source.velocity[1] += fy;
        source.velocity[2] += fz;
        target.velocity[0] -= fx;
        target.velocity[1] -= fy;
        target.velocity[2] -= fz;
      }
    }
  }

  update(damping: number = 0.9) {
    this.applyForces();

    // Update positions
    for (const node of this.nodes.values()) {
      node.position[0] += node.velocity[0];
      node.position[1] += node.velocity[1];
      node.position[2] += node.velocity[2];

      // Apply damping
      node.velocity[0] *= damping;
      node.velocity[1] *= damping;
      node.velocity[2] *= damping;
    }
  }

  getNodePosition(id: string): Vec3 | undefined {
    return this.nodes.get(id)?.position;
  }

  getLinks() {
    return this.links;
  }
}