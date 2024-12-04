'use client';

import { Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { FileNode } from '@/lib/analyzers/project-analyzer';

interface NodeLabelProps {
  node: FileNode;
  baseSize: number;
  isHovered: boolean;
  isSelected: boolean;
}

export function NodeLabel({
  node,
  baseSize,
  isHovered,
  isSelected
}: NodeLabelProps) {
  const shouldShowDetails = isHovered || isSelected;

  return (
    <Html
      center
      position={[0, baseSize * 1.2, 0]}
      style={{
        width: 'auto',
        transition: 'all 0.3s ease',
        pointerEvents: 'none',
      }}
    >
      <div className="relative flex flex-col items-center">
        {/* Main Label */}
        <div
          className="px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-md"
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transform: `scale(${shouldShowDetails ? 1.1 : 1})`,
            transition: 'all 0.3s ease',
          }}
        >
          <span className="text-white whitespace-nowrap">{node.name}</span>
        </div>

        {/* File Type Tag */}
        <div
          className="absolute -top-1 -right-2 px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase"
          style={{
            background: getTypeColor(node.category),
            color: 'white',
            opacity: shouldShowDetails ? 1 : 0,
            transform: `scale(${shouldShowDetails ? 1 : 0.8})`,
            transition: 'all 0.3s ease',
          }}
        >
          {node.category}
        </div>

        {/* Metrics Panel */}
        <AnimatePresence>
          {shouldShowDetails && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-2 p-2 rounded-lg"
              style={{
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div className="grid grid-cols-2 gap-2 text-xs">
                <MetricItem
                  label="Dependencies"
                  value={node.imports?.length || 0}
                  icon="⟶"
                />
                <MetricItem
                  label="Imported By"
                  value={node.importedBy?.length || 0}
                  icon="⟵"
                />
                {node.size && (
                  <MetricItem
                    label="Size"
                    value={`${(node.size / 1024).toFixed(1)}KB`}
                    icon="◈"
                  />
                )}
                {node.children && (
                  <MetricItem
                    label="Children"
                    value={node.children.length}
                    icon="◆"
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Html>
  );
}

function MetricItem({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div className="flex items-center gap-1.5 text-white/80">
      <span className="text-[10px] opacity-60">{icon}</span>
      <div className="flex flex-col">
        <span className="text-[9px] uppercase tracking-wider opacity-50">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
    </div>
  );
}

function getTypeColor(category: string): string {
  const colors = {
    component: '#4CAF50',
    page: '#2196F3',
    api: '#FF9800',
    util: '#9C27B0',
    hook: '#00BCD4',
    context: '#3F51B5',
    default: '#607D8B'
  };

  return colors[category as keyof typeof colors] || colors.default;
}