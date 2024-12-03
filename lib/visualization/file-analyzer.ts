import { CodeNode } from './types';

export async function analyzeFileStructure(path: string): Promise<CodeNode> {
  // Mock implementation for demo
  return {
    id: 'root',
    type: 'directory',
    name: 'project',
    children: [
      {
        id: 'src',
        type: 'directory',
        name: 'src',
        children: [
          {
            id: 'components',
            type: 'directory',
            name: 'components',
            size: 1500,
            dependencies: ['react', '@/lib/utils']
          }
        ]
      }
    ]
  };
}

export function calculateNodeMetrics(node: CodeNode) {
  const metrics = {
    totalSize: 0,
    dependencyCount: 0,
    maxDepth: 0
  };

  function traverse(node: CodeNode, depth: number) {
    metrics.totalSize += node.size || 0;
    metrics.dependencyCount += node.dependencies?.length || 0;
    metrics.maxDepth = Math.max(metrics.maxDepth, depth);

    node.children?.forEach(child => traverse(child, depth + 1));
  }

  traverse(node, 0);
  return metrics;
}