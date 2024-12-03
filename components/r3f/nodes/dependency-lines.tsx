"use client";

import { useState, useMemo } from "react";
import { Line, Sphere } from "@react-three/drei";
import { Color, Vector3 } from "three";
import { FileNode } from "@/lib/project-analyzer";

interface DependencyLinesProps {
  nodes: Map<string, { position: [number, number, number]; node: FileNode }>;
  highlightedNode?: string;
}

export function DependencyLines({ nodes, highlightedNode }: DependencyLinesProps) {
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);

  const dependencies = useMemo(() => {
    const deps: Array<{
      from: Vector3;
      to: Vector3;
      strength: number;
      id: string;
      fromNode: FileNode;
      toNode: FileNode;
    }> = [];

    nodes.forEach(({ position: fromPos, node: fromNode }) => {
      fromNode.imports.forEach((imp) => {
        // Find the target node based on the import path
        const toNodeEntry = Array.from(nodes.entries()).find(([_, { node }]) => 
          node.path.includes(imp) || imp.includes(node.name)
        );

        if (toNodeEntry) {
          const [toId, { position: toPos, node: toNode }] = toNodeEntry;
          deps.push({
            from: new Vector3(...fromPos),
            to: new Vector3(...toPos),
            strength: 1,
            id: `${fromNode.id}-${toId}`,
            fromNode,
            toNode
          });
        }
      });
    });

    return deps;
  }, [nodes]);

  return (
    <group>
      {dependencies.map(({ from, to, strength, id, fromNode, toNode }) => {
        const isHighlighted = 
          highlightedNode === fromNode.id || 
          highlightedNode === toNode.id;
        
        const isHovered = hoveredLine === id;
        
        const lineColor = new Color(isHighlighted ? "#ff4000" : "#4a9eff");
        const opacity = isHighlighted || isHovered ? 0.8 : 0.2;
        
        // Create a curved line
        const midPoint = new Vector3().addVectors(from, to).multiplyScalar(0.5);
        const height = from.distanceTo(to) * 0.2;
        midPoint.y += height;

        const points = [];
        const curve = new QuadraticBezierCurve3(from, midPoint, to);
        const numPoints = 50;
        
        for (let i = 0; i <= numPoints; i++) {
          points.push(curve.getPoint(i / numPoints));
        }

        return (
          <group key={id}>
            <Line
              points={points}
              color={lineColor}
              linewidth={isHighlighted || isHovered ? 2 : 1}
              transparent
              opacity={opacity}
              onPointerOver={() => setHoveredLine(id)}
              onPointerOut={() => setHoveredLine(null)}
            />
            {/* Add small spheres at curve points for better visibility */}
            {[0.25, 0.5, 0.75].map((t, i) => (
              <Sphere key={i} position={curve.getPoint(t)} args={[0.02]}>
                <meshBasicMaterial
                  color={lineColor}
                  transparent
                  opacity={opacity}
                />
              </Sphere>
            ))}
            {isHovered && (
              <Html position={midPoint.toArray()}>
                <div className="bg-background/90 backdrop-blur-sm rounded px-2 py-1 text-xs">
                  {fromNode.name} → {toNode.name}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}