"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { CodeNode } from "@/lib/visualization/types";
import { ChevronRight, ChevronDown, File, Folder } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TreeNodeProps {
  node: CodeNode;
  level: number;
}

function TreeNode({ node, level }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "flex items-center py-1 px-2 hover:bg-accent rounded-md cursor-pointer",
          "text-sm text-muted-foreground hover:text-foreground"
        )}
        style={{ paddingLeft: `${level * 12}px` }}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 mr-1" />
          ) : (
            <ChevronRight className="h-4 w-4 mr-1" />
          )
        ) : (
          <span className="w-5" />
        )}
        {node.type === "directory" ? (
          <Folder className="h-4 w-4 mr-2" />
        ) : (
          <File className="h-4 w-4 mr-2" />
        )}
        <span>{node.name}</span>
      </div>
      {isExpanded && node.children?.map((child) => (
        <TreeNode key={child.id} node={child} level={level + 1} />
      ))}
    </div>
  );
}

export function ProjectExplorer() {
  const codeStructure = useSelector((state: RootState) => state.visualization.codeStructure);

  if (!codeStructure) return null;

  return (
    <div className="mt-4">
      <h2 className="text-sm font-semibold text-muted-foreground px-2 mb-2">Explorer</h2>
      <div className="space-y-1">
        <TreeNode node={codeStructure} level={0} />
      </div>
    </div>
  );
}