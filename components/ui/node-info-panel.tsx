"use client";

import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export default function NodeInfoPanel() {
  const selectedNode = useSelector((state: RootState) => state.code.selectedNode);

  if (!selectedNode) return null;

  return (
    <Card className="absolute right-4 top-4 w-96 bg-background/90 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{selectedNode.name}</span>
          <Badge variant={selectedNode.type === 'file' ? 'default' : 'secondary'}>
            {selectedNode.type}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Complexity Metrics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Score</p>
                  <p className="text-2xl font-bold">
                    {selectedNode.complexity.toFixed(1)}
                  </p>
                </div>
                <ComplexityIndicator value={selectedNode.complexity} />
              </div>
            </section>

            <section>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Dependencies
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedNode.dependencies.map((dep, index) => (
                  <Badge key={index} variant="outline">
                    {dep}
                  </Badge>
                ))}
              </div>
            </section>

            {selectedNode.type === 'file' && (
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  File Details
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Path</span>
                    <span className="text-sm font-mono">
                      {selectedNode.path}
                    </span>
                  </div>
                </div>
              </section>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ComplexityIndicator({ value }: { value: number }) {
  const level = Math.min(Math.floor(value / 20), 4);
  const labels = ['Low', 'Moderate', 'High', 'Very High', 'Critical'];
  const colors = ['bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500', 'bg-red-700'];

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">Level</p>
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${colors[level]}`} />
        <span className="text-sm font-medium">{labels[level]}</span>
      </div>
    </div>
  );
}
