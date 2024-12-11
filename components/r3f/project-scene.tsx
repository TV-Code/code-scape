'use client';

import dynamic from 'next/dynamic';
import { useRef, useState, useEffect, useMemo } from 'react';
import { FileNode } from '@/lib/analyzers/project-analyzer';
import { DESIGN_SYSTEM } from '@/lib/design/system';
import { useCodeAnalysis } from '@/hooks/useCodeAnalysis';
import { CodeChat } from '@/components/chat/code-chat';
import { InsightMarker, ComponentRelationship } from '@/types/analysis';

// Dynamic imports for Three.js components
const Scene = dynamic(() => import('./scene').then((mod) => mod.Scene), {
    ssr: false,
});

const Canvas = dynamic(
    () => import('@react-three/fiber').then((mod) => mod.Canvas),
    { ssr: false }
);

const OrbitControls = dynamic(
    () => import('@react-three/drei').then((mod) => mod.OrbitControls),
    { ssr: false }
);

export function ProjectScene(props: { projectData: FileNode; onNodeSelect?: (node: FileNode) => void }) {
    const [activeMarker, setActiveMarker] = useState<InsightMarker | null>(null);
    const [sceneContext, setSceneContext] = useState({
        selectedNode: null,
        visibleNodes: new Set<string>(),
        activeMarker: null,
        currentPath: props.projectData.path
    });

    return (
        <div className="w-full h-full relative">
            <Canvas
                camera={{
                    position: [50, 30, 50],
                    fov: 50,
                    near: 0.1,
                    far: 1000
                }}
            >
                <Scene {...props} />
                <OrbitControls
                    makeDefault
                    enableDamping
                    dampingFactor={0.05}
                    maxDistance={150}
                    minDistance={5}
                />
            </Canvas>

            <CodeChat 
                context={sceneContext}
                onVisualizationRequest={(type, data) => {
                    console.log('Visualization request:', type, data);
                }}
            />

            {activeMarker && (
                <div className="absolute top-4 right-4 bg-background/90 p-4 rounded-lg shadow-lg max-w-md">
                    <h3 className="text-lg font-semibold mb-2">{activeMarker.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        {activeMarker.description}
                    </p>
                    {activeMarker.relatedFiles && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Related Files:</h4>
                            <div className="flex flex-wrap gap-2">
                                {activeMarker.relatedFiles.map((file, index) => (
                                    <button
                                        key={index}
                                        className="text-xs bg-primary/10 hover:bg-primary/20 rounded px-2 py-1"
                                        onClick={() => {
                                            const node = Object.values(props.projectData)
                                                .find(n => n.path === file);
                                            if (node) {
                                                props.onNodeSelect?.(node);
                                            }
                                        }}
                                    >
                                        {file.split('/').pop()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <button
                        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setActiveMarker(null)}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}