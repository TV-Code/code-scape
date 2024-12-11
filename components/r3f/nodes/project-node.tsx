'use client';

import { useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { FileNode } from '@/lib/analyzers/project-analyzer';
import { Vector3, Color, Mesh } from 'three';
import { gsap } from 'gsap';

interface ProjectNodeProps {
    node: FileNode;
    position: [number, number, number];
    isHovered: boolean;
    isSelected: boolean;
    isUnused: boolean;
    showLabel?: boolean;
    onClick?: () => void;
    onHover?: (isHovered: boolean) => void;
}

const NODE_COLORS = {
    default: new Color('#4a90e2'),
    hovered: new Color('#64b5f6'),
    selected: new Color('#2196f3'),
    unused: new Color('#9e9e9e'),
} as const;

export function ProjectNode({
    node,
    position,
    isHovered,
    isSelected,
    isUnused,
    showLabel = true,
    onClick,
    onHover
}: ProjectNodeProps) {
    const meshRef = useRef<Mesh>(null);
    const [labelPosition] = useState(() => new Vector3(...position).add(new Vector3(0, 0.5, 0)));
    const targetScale = isHovered || isSelected ? 1.2 : 1;

    useFrame(() => {
        if (meshRef.current) {
            // Smooth scale animation
            meshRef.current.scale.lerp(new Vector3(targetScale, targetScale, targetScale), 0.1);

            // Gentle floating animation
            const time = Date.now() * 0.001;
            meshRef.current.position.y = position[1] + Math.sin(time) * 0.05;
        }
    });

    // Handle hover events
    const handlePointerOver = () => {
        if (meshRef.current) {
            gsap.to(meshRef.current.scale, {
                x: targetScale,
                y: targetScale,
                z: targetScale,
                duration: 0.2,
                ease: 'back.out(1.7)'
            });
        }
        onHover?.(true);
    };

    const handlePointerOut = () => {
        if (meshRef.current) {
            gsap.to(meshRef.current.scale, {
                x: 1,
                y: 1,
                z: 1,
                duration: 0.2,
                ease: 'back.out(1.7)'
            });
        }
        onHover?.(false);
    };

    // Get node color based on state
    const getNodeColor = () => {
        if (isSelected) return NODE_COLORS.selected;
        if (isHovered) return NODE_COLORS.hovered;
        if (isUnused) return NODE_COLORS.unused;
        return NODE_COLORS.default;
    };

    return (
        <group position={position}>
            <mesh
                ref={meshRef}
                onClick={onClick}
                onPointerOver={handlePointerOver}
                onPointerOut={handlePointerOut}
            >
                <sphereGeometry args={[0.3, 32, 32]} />
                <meshPhysicalMaterial
                    color={getNodeColor()}
                    roughness={0.5}
                    metalness={0.5}
                    transparent
                    opacity={0.8}
                    envMapIntensity={1}
                />
            </mesh>
            
            {showLabel && (
                <Html position={[0, 0.5, 0]} center>
                    <div className={`
                        px-2 py-1 
                        text-xs 
                        rounded 
                        whitespace-nowrap
                        transition-all
                        transform
                        ${isHovered || isSelected ? 'scale-110' : 'scale-100'}
                        ${isHovered || isSelected ? 'bg-background/90' : 'bg-background/70'}
                        ${isHovered || isSelected ? 'text-foreground' : 'text-foreground/70'}
                    `}>
                        {node.name}
                        {isHovered && node.imports && (
                            <div className="text-[10px] text-muted-foreground">
                                {node.imports.length} imports
                            </div>
                        )}
                    </div>
                </Html>
            )}
        </group>
    );
}