"use client";

import { useEffect, useState } from 'react';
import { FileNode } from '@/lib/analyzers/file-system-analyzer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Folder,
  File,
  AlertTriangle,
  GitBranch,
  Code2,
  FileCode,
} from "lucide-react";

interface NodeDetailsPanelProps {
  node: FileNode;
}

export default function NodeDetailsPanel({ node }: NodeDetailsPanelProps) {
  const [fileContent, setFileContent] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      if (node.type === 'file') {
        try {
          const response = await fetch(`/api/file-content?path=${encodeURIComponent(node.path)}`);
          const content = await response.text();
          setFileContent(content);
        } catch (error) {
          console.error('Error fetching file content:', error);
        }
      }
    };

    fetchContent();
  }, [node]);

  return (
    <Card className="absolute top-4 right-4 w-96 bg-background/90 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {node.type === 'directory' ? (
              <Folder className="h-5 w-5" />
            ) : (
              <FileCode className="h-5 w-5" />
            )}
            <CardTitle>{node.name}</CardTitle>
          </div>
          <Badge variant={node.type === 'file' ? "default" : "secondary"}>
            {node.type}
          </Badge>
        </div>
        <CardDescription>{node.path}</CardDescription>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {/* Metrics */}
            <section>
              <h3 className="font-semibold mb-2">Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                {node.type === 'file' && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Size</p>
                      <p className="text-2xl font-bold">
                        {formatFileSize(node.size)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Complexity</p>
                      <p className="text-2xl font-bold">{node.complexity}</p>
                    </div>
                  </>
                )}
                {node.type === 'directory' && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Files</p>
                      <p className="text-2xl font-bold">
                        {node.children?.length || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Size</p>
                      <p className="text-2xl font-bold">{formatFileSize(node.size)}</p>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Dependencies */}
            {node.type === 'file' && node.dependencies.length > 0 && (
              <section>
                <h3 className="font-semibold mb-2">Dependencies</h3>
                <div className="space-y-2">
                  {node.dependencies.map((dep, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 text-sm bg-muted p-2 rounded"
                    >
                      <GitBranch className="h-4 w-4" />
                      <span>{dep}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Issues */}
            {node.type === 'file' && node.issues.length > 0 && (
              <section>
                <h3 className="font-semibold mb-2">Issues</h3>
                <div className="space-y-2">
                  {node.issues.map((issue, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-2 text-sm bg-muted p-2 rounded"
                    >
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* File Preview */}
            {node.type === 'file' && fileContent && (
              <section>
                <h3 className="font-semibold mb-2">Preview</h3>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded overflow-x-auto">
                    <code>{fileContent}</code>
                  </pre>
                </div>
              </section>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}