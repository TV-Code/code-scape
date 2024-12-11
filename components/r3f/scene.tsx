'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { FileNode } from '@/lib/analyzers/project-analyzer';
import { ProjectNode } from './nodes/project-node';
import { FolderBubble } from './nodes/FolderBubble';
import { Line } from '@react-three/drei';
import { HierarchicalSphereLayout } from '@/lib/layout/hierarchical-sphere';
import { DESIGN_SYSTEM } from '@/lib/design/system';
import { useCodeAnalysis } from '@/hooks/useCodeAnalysis';
import { InsightVisualization } from '@/components/visualization/insight-visualization';
import { InsightMarker, ComponentRelationship } from '@/types/analysis';
import * as THREE from 'three';

interface FileConnection {
    points: THREE.Vector3[];
    type: 'import' | 'child';
}

function cleanPath(path: string): string {
    path = path.replace(/\.(tsx?|jsx?|js|mjs|cjs)$/, '');
    if (path.startsWith('/')) {
        path = path.slice(1);
    }
    const possibleRoots = ['src', 'app', 'lib', 'source', 'packages'];
    for (const root of possibleRoots) {
        const rootIndex = path.indexOf(`/${root}/`);
        if (rootIndex !== -1) {
            return path.slice(rootIndex + root.length + 2);
        }
    }
    const parts = path.split('/');
    const cleanedParts = parts.filter(part => 
        !part.startsWith('.') && 
        !part.startsWith('tmp') && 
        !part.includes('codescape-') &&
        !part === 'node_modules'
    );
    return cleanedParts.join('/');
}

function findMatchingNode(nodes: Map<string, FileNode>, importPath: string, sourceFile: FileNode): FileNode | undefined {
    const cleanImport = cleanPath(importPath);
    for (const node of nodes.values()) {
        const nodePath = cleanPath(node.path);
        if (nodePath === cleanImport) {
            return node;
        }
    }
    if (importPath.startsWith('.')) {
        const sourceDir = sourceFile.path.split('/').slice(0, -1).join('/');
        const absolutePath = cleanPath(sourceDir + '/' + importPath.replace(/^\.\//, ''));
        for (const node of nodes.values()) {
            const nodePath = cleanPath(node.path);
            if (nodePath === absolutePath) {
                return node;
            }
        }
    }
    for (const node of nodes.values()) {
        const nodePath = cleanPath(node.path);
        if (nodePath.includes(cleanImport)) {
            return node;
        }
    }
    return undefined;
}

interface SceneProps {
    projectData: FileNode;
    onNodeSelect?: (node: FileNode) => void;
}

export function Scene({ projectData, onNodeSelect }: SceneProps) {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [nodePositions, setNodePositions] = useState(new Map<string, [number, number, number]>());
    const [folderSizes, setFolderSizes] = useState(new Map<string, number>());
    const [connections, setConnections] = useState<FileConnection[]>([]);
    const [activeMarker, setActiveMarker] = useState<InsightMarker | null>(null);
    const [visibleNodes] = useState(new Set<string>());
    const { camera } = useThree();
    const { analyzeArchitecture, getAnalysis } = useCodeAnalysis();

    const { files, folders } = useMemo(() => {
        const fileNodes = new Map<string, FileNode>();
        const folderNodes = new Map<string, FileNode>();

        function processNode(node: FileNode) {
            if (node.type === 'directory') {
                if (!node.path.includes('node_modules') && 
                    !node.path.includes('.git') && 
                    !node.path.startsWith('.')) {
                    folderNodes.set(node.id, node);
                }
                node.children?.forEach(processNode);
            } else if (node.type === 'file' && 
                      /\.(tsx?|jsx?|js|mjs|cjs)$/.test(node.path) &&
                      !node.path.includes('node_modules')) {
                fileNodes.set(node.id, {
                    ...node,
                    imports: node.imports?.map(imp => cleanPath(imp))
                });
            }
        }

        processNode(projectData);
        return { files: fileNodes, folders: folderNodes };
    }, [projectData]);

    useEffect(() => {
        const layout = new HierarchicalSphereLayout();
        const { positions, folderSizes: sizes } = layout.layoutNodes(projectData);
        setNodePositions(positions);
        setFolderSizes(sizes);
    }, [projectData]);

    useEffect(() => {
        if (nodePositions.size === 0 || files.size === 0) return;
        
        const newConnections: FileConnection[] = [];
        const processed = new Set<string>();

        files.forEach((sourceFile) => {
            if (!sourceFile.imports?.length) return;

            const sourcePos = nodePositions.get(sourceFile.id);
            if (!sourcePos) return;

            sourceFile.imports.forEach(importPath => {
                const targetFile = findMatchingNode(files, importPath, sourceFile);
                if (!targetFile) return;

                const targetPos = nodePositions.get(targetFile.id);
                if (!targetPos) return;

                const connectionKey = `${sourceFile.id}-${targetFile.id}`;
                if (processed.has(connectionKey)) return;
                processed.add(connectionKey);

                const start = new THREE.Vector3(...sourcePos);
                const end = new THREE.Vector3(...targetPos);
                const midPoint = start.clone().add(end).multiplyScalar(0.5);
                const dist = start.distanceTo(end);
                midPoint.y += dist * 0.2;

                const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
                newConnections.push({
                    points: curve.getPoints(20),
                    type: 'import'
                });
            });
        });

        setConnections(newConnections);
    }, [nodePositions, files]);

    useEffect(() => {
        analyzeArchitecture().catch(console.error);
    }, [projectData, analyzeArchitecture]);

    const handleMarkerClick = (marker: InsightMarker) => {
        setActiveMarker(marker);
        if (marker.relatedFiles?.length) {
            marker.relatedFiles.forEach(filePath => {
                const node = Array.from(files.values()).find(n => n.path === filePath);
                if (node) {
                    getAnalysis(node.id).catch(console.error);
                }
            });
        }
    };

    const handleRelationshipClick = (relationship: ComponentRelationship) => {
        const sourceNode = Array.from(files.values()).find(n => n.path === relationship.source);
        const targetNode = Array.from(files.values()).find(n => n.path === relationship.target);

        if (sourceNode && targetNode) {
            const sourcePos = nodePositions.get(sourceNode.id);
            const targetPos = nodePositions.get(targetNode.id);

            if (sourcePos && targetPos) {
                const start = new THREE.Vector3(...sourcePos);
                const end = new THREE.Vector3(...targetPos);
                const midPoint = start.clone().add(end).multiplyScalar(0.5);
                const dist = start.distanceTo(end);
                midPoint.y += dist * 0.2;

                setConnections(prev => [
                    ...prev,
                    {
                        points: new THREE.QuadraticBezierCurve3(start, midPoint, end).getPoints(20),
                        type: 'child'
                    }
                ]);

                Promise.all([
                    getAnalysis(sourceNode.id),
                    getAnalysis(targetNode.id)
                ]).catch(console.error);
            }
        }
    };

    return (
        <group>
            <color attach="background" args={[DESIGN_SYSTEM.colors.background]} />
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={0.6} />

            {connections.map((conn, i) => (
                <Line
                    key={i}
                    points={conn.points}
                    color={conn.type === 'import' ? "#4a90e2" : "#ffaa00"}
                    lineWidth={conn.type === 'import' ? 1 : 2}
                    transparent
                    opacity={conn.type === 'import' ? 0.4 : 0.6}
                />
            ))}

            {Array.from(folders.entries()).map(([id, folder]) => {
                const position = nodePositions.get(id);
                if (!position) return null;

                return (
                    <FolderBubble
                        key={id}
                        position={position}
                        radius={folderSizes.get(id) || 10}
                        name={folder.name}
                        childCount={(folder.children?.filter(c => c.type === 'file').length || 0)}
                        isHovered={hoveredNode === id}
                        isSelected={selectedNode === id}
                        showLabel
                        onHover={(hovering) => setHoveredNode(hovering ? id : null)}
                        onClick={() => {
                            setSelectedNode(id === selectedNode ? null : id);
                            onNodeSelect?.(folder);
                            folder.children?.forEach(child => {
                                if (child.type === 'file') {
                                    getAnalysis(child.id).catch(console.error);
                                }
                            });
                        }}
                    />
                );
            })}

            {Array.from(files.entries()).map(([id, file]) => {
                const position = nodePositions.get(id);
                if (!position) return null;

                return (
                    <ProjectNode
                        key={id}
                        node={file}
                        position={position}
                        isHovered={hoveredNode === id}
                        isSelected={selectedNode === id}
                        isUnused={!file.imports?.length && !file.importedBy?.length}
                        showLabel
                        onClick={() => {
                            setSelectedNode(id === selectedNode ? null : id);
                            onNodeSelect?.(file);
                            getAnalysis(id).catch(console.error);
                            file.imports?.forEach(importPath => {
                                const targetFile = findMatchingNode(files, importPath, file);
                                if (targetFile) {
                                    getAnalysis(targetFile.id).catch(console.error);
                                }
                            });
                        }}
                        onHover={(hovering) => setHoveredNode(hovering ? id : null)}
                    />
                );
            })}

            <InsightVisualization
                projectData={projectData}
                selectedNode={selectedNode}
                onMarkerClick={handleMarkerClick}
                onRelationshipClick={handleRelationshipClick}
            />
        </group>
    );
}