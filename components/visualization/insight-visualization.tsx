'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Vector3, Color, Group, Mesh, Quaternion } from 'three';
import { useCodeAnalysis } from '@/hooks/useCodeAnalysis';
import { gsap } from 'gsap';
import {
    InsightMarker,
    ComponentRelationship,
    CodeMetrics,
    SemanticConnection,
    ArchitecturePattern
} from '@/types/analysis';

interface InsightVisualizationProps {
    projectData: any;
    selectedNode?: string | null;
    onMarkerClick?: (marker: InsightMarker) => void;
    onRelationshipClick?: (relationship: ComponentRelationship) => void;
}

const COLOR_SCALE = {
    warning: new Color('#ff4444'),
    suggestion: new Color('#44ff44'),
    info: new Color('#4444ff')
};

const QUALITY_COLORS = {
    high: new Color('#00ff00'),
    medium: new Color('#ffff00'),
    low: new Color('#ff0000')
};

export function InsightVisualization({
    projectData,
    selectedNode,
    onMarkerClick,
    onRelationshipClick
}: InsightVisualizationProps) {
    const { visualizationData = { markers: [], relationships: [], patterns: [], semanticGroups: [] }, analyzeArchitecture } = useCodeAnalysis();
    const { camera, scene } = useThree();
    const groupRef = useRef<Group>(null);
    const [hoveredInsight, setHoveredInsight] = useState<string | null>(null);

    // Initialize analysis when component mounts
    useEffect(() => {
        analyzeArchitecture().catch(console.error);
    }, [projectData, analyzeArchitecture]);

    // Quality metrics visualization
    const MetricsVisualization = ({ metrics, position }: { metrics: CodeMetrics, position: Vector3 }) => {
        const meshRef = useRef<Mesh>(null);
        
        useEffect(() => {
            if (meshRef.current) {
                gsap.from(meshRef.current.scale, {
                    x: 0, y: 0, z: 0,
                    duration: 0.5,
                    ease: "back.out(1.7)"
                });
            }
        }, []);

        const qualityColor = useMemo(() => {
            const score = (metrics.maintainability + (metrics.testCoverage || 0)) / 2;
            if (score > 75) return QUALITY_COLORS.high;
            if (score > 50) return QUALITY_COLORS.medium;
            return QUALITY_COLORS.low;
        }, [metrics]);

        return (
            <mesh ref={meshRef} position={position}>
                <sphereGeometry args={[0.5, 32, 32]} />
                <meshBasicMaterial color={qualityColor} transparent opacity={0.6} />
            </mesh>
        );
    };

    // Semantic connections
    const SemanticConnections = useMemo(() => {
        return visualizationData.relationships.map((rel, index) => {
            const startVec = new Vector3(...(rel.source as unknown as [number, number, number]));
            const endVec = new Vector3(...(rel.target as unknown as [number, number, number]));
            const midPoint = startVec.clone().add(endVec).multiplyScalar(0.5);
            const dist = startVec.distanceTo(endVec);
            midPoint.y += dist * 0.2;

            return (
                <group key={`semantic-${index}`}>
                    <line>
                        <bufferGeometry attach="geometry">
                            <bufferAttribute
                                attachObject={['attributes', 'position']}
                                count={2}
                                array={new Float32Array([...startVec.toArray(), ...endVec.toArray()])}
                                itemSize={3}
                            />
                        </bufferGeometry>
                        <lineBasicMaterial
                            attach="material"
                            color={new Color().setHSL(rel.strength * 0.3, 0.7, 0.5)}
                            transparent
                            opacity={rel.strength * 0.7}
                        />
                    </line>
                    <Html position={midPoint.toArray()}>
                        <div className="text-xs bg-background/80 px-2 py-1 rounded">
                            {rel.type}
                        </div>
                    </Html>
                </group>
            );
        });
    }, [visualizationData.relationships]);

    // Insight bubbles
    const InsightBubbles = useMemo(() => {
        return visualizationData.markers.map((marker, index) => {
            const bubbleRef = useRef<Mesh>(null);
            const position = new Vector3(...marker.position);

            useEffect(() => {
                if (bubbleRef.current) {
                    gsap.from(bubbleRef.current.scale, {
                        x: 0, y: 0, z: 0,
                        duration: 0.5,
                        delay: index * 0.1,
                        ease: "elastic.out(1, 0.5)"
                    });
                }
            }, []);

            const isHovered = hoveredInsight === marker.title;

            return (
                <group
                    key={`insight-${index}`}
                    position={position}
                    onClick={() => onMarkerClick?.(marker)}
                    onPointerOver={() => setHoveredInsight(marker.title)}
                    onPointerOut={() => setHoveredInsight(null)}
                >
                    <mesh ref={bubbleRef}>
                        <sphereGeometry args={[0.3, 32, 32]} />
                        <meshBasicMaterial
                            color={COLOR_SCALE[marker.type]}
                            transparent
                            opacity={isHovered ? 0.8 : 0.6}
                        />
                    </mesh>
                    {isHovered && (
                        <Html>
                            <div className="bg-background/90 p-2 rounded shadow-lg max-w-xs">
                                <h3 className="font-medium text-sm">{marker.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {marker.description}
                                </p>
                                {marker.metrics && (
                                    <div className="mt-2 text-xs">
                                        <div className="flex justify-between">
                                            <span>Complexity:</span>
                                            <span>{marker.metrics.complexity}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Maintainability:</span>
                                            <span>{marker.metrics.maintainability}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Html>
                    )}
                </group>
            );
        });
    }, [visualizationData.markers, hoveredInsight, onMarkerClick]);

    // Pattern visualization
    const PatternVisualizations = useMemo(() => {
        return (visualizationData.patterns || []).map((pattern, index) => {
            // Calculate pattern center based on included files
            const center = new Vector3(0, 0, 0);
            // This would need to be calculated based on actual file positions

            return (
                <group key={`pattern-${index}`}>
                    <mesh position={center}>
                        <sphereGeometry args={[1, 32, 32]} />
                        <meshBasicMaterial
                            color={new Color().setHSL(index * 0.1, 0.6, 0.5)}
                            transparent
                            opacity={0.2}
                        />
                    </mesh>
                    <Html position={center.clone().add(new Vector3(0, 1.5, 0))}>
                        <div className="bg-background/80 px-2 py-1 rounded text-xs">
                            {pattern.name}
                        </div>
                    </Html>
                </group>
            );
        });
    }, [visualizationData.patterns]);

    // Animate insights
    useFrame((state, delta) => {
        if (groupRef.current) {
            // Add subtle floating animation
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;

            // Rotate bubbles to face camera
            groupRef.current.children.forEach(child => {
                if (child instanceof Mesh) {
                    child.quaternion.copy(camera.quaternion);
                }
            });
        }
    });

    return (
        <group ref={groupRef}>
            {SemanticConnections}
            {InsightBubbles}
            {PatternVisualizations}
        </group>
    );
}