import { FileNode } from "@/lib/analyzers/project-analyzer";

export interface DependencyLink {
  source: string;
  target: string;
  type: 'import' | 'child';
  strength: number;
}

export function mapDependencies(node: FileNode, processed = new Set<string>()): DependencyLink[] {
  const links: DependencyLink[] = [];
  
  if (processed.has(node.id)) return links;
  processed.add(node.id);

  // Add direct import dependencies
  node.imports?.forEach(importPath => {
    links.push({
      source: node.id,
      target: importPath,
      type: 'import',
      strength: 1
    });
  });

  // Add parent-child relationships
  node.children?.forEach(child => {
    links.push({
      source: node.id,
      target: child.id,
      type: 'child',
      strength: 0.5 // Parent-child relationships are visually subtler
    });
    
    // Recursively process children
    links.push(...mapDependencies(child, processed));
  });

  return links;
}

export function calculateDependencyStrength(
  fromNode: FileNode,
  toNode: FileNode
): number {
  let strength = 1;

  // Increase strength based on number of imports
  const importCount = fromNode.imports?.filter(imp => imp === toNode.id).length || 0;
  strength += importCount * 0.2;

  // Increase strength based on complexity
  strength *= (1 + Math.log2(1 + fromNode.complexity) * 0.1);

  // Cap the maximum strength
  return Math.min(strength, 2);
}
