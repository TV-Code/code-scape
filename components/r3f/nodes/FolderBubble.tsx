'use client';

import { useRef, useState, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Vector3, Color, Mesh, Group, MeshBasicMaterial } from 'three';
import { gsap } from 'gsap';

interface FolderBubbleProps {
    position: [number, number, number];
    radius: number;
    name: string;
    childCount: number;
    isHovered: boolean;
    isSelected: boolean;
    showLabel?: boolean;
    onClick?: () => void;
    onHover?: (isHovered: boolean) => void;
}

const BUBBLE_COLORS = {
    default: new Color('#4a5568'),
    hovered: new Color('#718096'),
    selected: new Color('#2d3748'),
} as const;

export function FolderBubble({
    position,
    radius,
    name,
    childCount,
    isHovered,
    isSelected,
    showLabel = true,
    onClick,
    onHover
}: FolderBubbleProps) {
    const groupRef = useRef<Group>(null);
    const sphereRef = useRef<Mesh>(null);
    const outerSphereRef = useRef<Mesh>(null);
    const labelRef = useRef<HTMLDivElement>(null);
    const [labelPosition] = useState(() => new Vector3(...position).add(new Vector3(0, radius + 0.5, 0)));

    // Initialize animations
    useEffect(() => {
        if (sphereRef.current && outerSphereRef.current) {
            // Initial scale animation
            gsap.from(sphereRef.current.scale, {
                x: 0,
                y: 0,
                z: 0,
                duration: 0.5,
                ease: 'back.out(1.7)'
            });

            gsap.from(outerSphereRef.current.scale, {
                x: 0,
                y: 0,
                z: 0,
                duration: 0.7,
                ease: 'elastic.out(1, 0.3)'
            });
        }
    }, []);

    // Handle hover animations
    useEffect(() => {
        if (sphereRef.current && outerSphereRef.current) {
            const targetScale = isHovered || isSelected ? 1.1 : 1;
            const targetOpacity = isHovered || isSelected ? 0.3 : 0.15;

            gsap.to(sphereRef.current.scale, {
                x: targetScale,
                y: targetScale,
                z: targetScale,
                duration: 0.2,
                ease: 'power2.out'
            });

            gsap.to(outerSphereRef.current.scale, {
                x: targetScale,
                y: targetScale,
                z: targetScale,
                duration: 0.3,
                ease: 'power2.out'
            });

            const material = outerSphereRef.current.material as MeshBasicMaterial;
            gsap.to(material, {
                opacity: targetOpacity,
                duration: 0.2
            });
        }
    }, [isHovered, isSelected]);

    // Gentle floating animation
    useFrame((state) => {
        if (groupRef.current) {
            const time = state.clock.getElapsedTime();
            groupRef.current.position.y = position[1] + Math.sin(time * 0.5) * 0.05;
        }
    });

    // Get bubble color based on state
    const getBubbleColor = () => {
        if (isSelected) return BUBBLE_COLORS.selected;
        if (isHovered) return BUBBLE_COLORS.hovered;
        return BUBBLE_COLORS.default;
    };

    return (
        <group ref={groupRef} position={position}>
            {/* Inner sphere */}
            <mesh
                ref={sphereRef}
                onClick={onClick}
                onPointerOver={() => onHover?.(true)}
                onPointerOut={() => onHover?.(false)}
            >
                <sphereGeometry args={[radius * 0.8, 32, 32]} />
                <meshPhysicalMaterial
                    color={getBubbleColor()}
                    roughness={0.4}
                    metalness={0.1}
                    transparent
                    opacity={0.6}
                    envMapIntensity={1}
                />
            </mesh>

            {/* Outer transparent sphere */}
            <mesh
                ref={outerSphereRef}
                onClick={onClick}
                onPointerOver={() => onHover?.(true)}
                onPointerOut={() => onHover?.(false)}
            >
                <sphereGeometry args={[radius, 32, 32]} />
                <meshBasicMaterial
                    color={getBubbleColor()}
                    transparent
                    opacity={0.15}
                    depthWrite={false}
                />
            </mesh>

            {/* Label */}
            {showLabel && (
                <Html position={[0, radius + 0.5, 0]} center>
                    <div
                        ref={labelRef}
                        className={`
                            px-3 py-1.5 
                            rounded-lg
                            transition-all
                            transform
                            ${isHovered || isSelected ? 'scale-110' : 'scale-100'}
                            ${isHovered || isSelected ? 'bg-background' : 'bg-background/80'}
                        `}
                    >
                        <div className="text-sm font-medium text-foreground">
                            {name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {childCount} {childCount === 1 ? 'file' : 'files'}
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
}