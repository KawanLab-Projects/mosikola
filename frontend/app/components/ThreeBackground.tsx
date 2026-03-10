"use client"

import { useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Points, PointMaterial } from "@react-three/drei"
import * as random from "maath/random/dist/maath-random.cjs"
import { Group, Points as ThreePoints } from "three"

function Stars(props: React.ComponentProps<typeof Points>) {
    const ref = useRef<ThreePoints>(null)
    const groupRef = useRef<Group>(null)
    const [sphere] = useState(() => random.inSphere(new Float32Array(5001), { radius: 1.5 }) as Float32Array)

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x -= delta / 10
            ref.current.rotation.y -= delta / 15
        }
        if (groupRef.current) {
            // Smoothly rotate the group based on mouse position
            groupRef.current.rotation.y += (state.pointer.x / 4 - groupRef.current.rotation.y) * 5 * delta
            groupRef.current.rotation.x += (-state.pointer.y / 4 - groupRef.current.rotation.x) * 5 * delta
        }
    })

    return (
        <group ref={groupRef} rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial
                    transparent
                    color="#8b5cf6" // Violet-500
                    size={0.002}
                    sizeAttenuation={true}
                    depthWrite={false}
                />
            </Points>
        </group>
    )
}

export default function ThreeBackground() {
    return (
        <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 0, 1] }}>
                <Stars />
            </Canvas>
        </div>
    )
}
