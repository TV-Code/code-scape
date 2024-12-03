"use client"

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense, useRef } from 'react'
import type { Mesh } from 'three'
import { useFrame } from '@react-three/fiber'

function Box() {
  const meshRef = useRef<Mesh>(null)

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta
      meshRef.current.rotation.y += delta * 0.5
    }
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry />
      <meshNormalMaterial />
    </mesh>
  )
}

export default function View() {
  return (
    <div className="h-screen">
      <Canvas>
        <Suspense fallback={null}>
          <OrbitControls />
          <ambientLight intensity={0.5} />
          <Box />
        </Suspense>
      </Canvas>
    </div>
  )
}