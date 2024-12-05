'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { FileNode } from '@/lib/analyzers/project-analyzer';
import { ProjectNode } from './nodes/project-node';
import { FolderBubble } from './nodes/FolderBubble';
import { Line } from '@react-three/drei';
import { HierarchicalSphereLayout } from '@/lib/layout/hierarchical-sphere';
import { DESIGN_SYSTEM } from '@/lib/design/system';
import * as THREE from 'three';

interface FileConnection {
    points: THREE.Vector3[];
    type: 'import' | 'child';
}

function cleanPath(path: string): string {
    // Extract path after src/
    const match = path.match(/\/src\/(.+?)(?:\.(tsx?|jsx?))?$/);
    return match ? match[1] : path;
}

function findMatchingNode(nodes: Map<string, FileNode>, importPath: string): FileNode | undefined {
    // Clean up the import path
    const cleanImport = cleanPath(importPath);
    console.log('Looking for:', cleanImport);

    for (const node of nodes.values()) {
        const nodePath = cleanPath(node.path);
        console.log('Checking against:', nodePath);

        if (nodePath === cleanImport) {
            return node;
        }
    }

    return undefined;
}

function Scene({ projectData, onNodeSelect }: { projectData: FileNode; onNodeSelect?: (node: FileNode) => void }) {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [nodePositions, setNodePositions] = useState(new Map<string, [number, number, number]>());
    const [folderSizes, setFolderSizes] = useState(new Map<string, number>());
    const [connections, setConnections] = useState<FileConnection[]>([]);
    const { camera } = useThree();

    // Process files and folders
    const { files, folders } = useMemo(() => {
        const fileNodes = new Map<string, FileNode>();
        const folderNodes = new Map<string, FileNode>();

        function processNode(node: FileNode) {
            if (node.type === 'directory') {
                if (node.path.includes('/src/')) {
                    folderNodes.set(node.id, node);
                }
                node.children?.forEach(processNode);
            } else if (node.type === 'file' && 
                      (node.path.endsWith('.tsx') || node.path.endsWith('.ts')) &&
                      node.path.includes('/src/')) {
                fileNodes.set(node.id, {
                    ...node,
                    // Remove the base path from imports
                    imports: node.imports?.map(imp => {
                        const cleanedImport = cleanPath(imp);
                        console.log('Clean import:', cleanedImport);
                        return cleanedImport;
                    })
                });
                console.log('File:', cleanPath(node.path));
                if (node.imports?.length) {
                    console.log('Imports:', node.imports);
                }
            }
        }

        processNode(projectData);
        return { files: fileNodes, folders: folderNodes };
    }, [projectData]);

    // Calculate layout
    useEffect(() => {
        const layout = new HierarchicalSphereLayout();
        const { positions, folderSizes: sizes } = layout.layoutNodes(projectData);
        setNodePositions(positions);
        setFolderSizes(sizes);
        console.log('Positions calculated:', positions.size);
    }, [projectData]);

    // Create connections
    useEffect(() => {
        if (nodePositions.size === 0 || files.size === 0) return;
        
        const newConnections: FileConnection[] = [];
        const processed = new Set<string>();

        files.forEach((sourceFile) => {
            if (!sourceFile.imports?.length) return;

            const sourcePos = nodePositions.get(sourceFile.id);
            if (!sourcePos) return;

            sourceFile.imports.forEach(importPath => {
                const targetFile = findMatchingNode(files, importPath);
                if (!targetFile) {
                    console.log('No match found for import:', importPath, 'from', cleanPath(sourceFile.path));
                    return;
                }

                const targetPos = nodePositions.get(targetFile.id);
                if (!targetPos) return;

                const connectionKey = `${sourceFile.id}-${targetFile.id}`;
                if (processed.has(connectionKey)) return;
                processed.add(connectionKey);

                console.log('Creating connection:', 
                    cleanPath(sourceFile.path), 
                    '→', 
                    cleanPath(targetFile.path)
                );

                // Create the connection curve
                const start = new THREE.Vector3(...sourcePos);
                const end = new THREE.Vector3(...targetPos);
                const mid = start.clone().add(end).multiplyScalar(0.5);
                const dist = start.distanceTo(end);
                mid.y += dist * 0.2;

                const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
                newConnections.push({
                    points: curve.getPoints(20),
                    type: 'import'
                });
            });
        });

        console.log('Created connections:', newConnections.length);
        setConnections(newConnections);
    }, [nodePositions, files]);

    return (
        <group>
            <color attach="background" args={[DESIGN_SYSTEM.colors.background]} />
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={0.6} />

            {/* Import Connections */}
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

            {/* Folder Bubbles */}
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
                        }}
                    />
                );
            })}

            {/* File Nodes */}
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
                        }}
                        onHover={(hovering) => setHoveredNode(hovering ? id : null)}
                    />
                );
            })}
        </group>
    );
}

export function ProjectScene(props: { projectData: FileNode; onNodeSelect?: (node: FileNode) => void }) {
    return (
        <div className="w-full h-full">
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
                    maxDistance={300}
                    minDistance={5}
                />
            </Canvas>
        </div>
    );
}