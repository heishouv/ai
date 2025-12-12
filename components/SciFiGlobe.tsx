import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Wireframe } from '@react-three/drei';
import * as THREE from 'three';

interface SciFiGlobeProps {
  rotation: { x: number; y: number };
  scale: number;
}

export const SciFiGlobe: React.FC<SciFiGlobeProps> = ({ rotation, scale }) => {
  const meshRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Smooth interpolation for user interactions
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, rotation.x * Math.PI * 2, 0.1);
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, rotation.y * Math.PI, 0.1);
      
      const targetScale = 1.5 * scale; // Base size multiplier
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }

    if (coreRef.current) {
      coreRef.current.rotation.y -= delta * 0.2; // Idle spin
    }

    if (ringsRef.current) {
        ringsRef.current.rotation.z += delta * 0.1;
        ringsRef.current.rotation.x += delta * 0.05;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Main Wireframe Globe */}
      <Sphere args={[1, 32, 32]}>
        <meshBasicMaterial color="#06b6d4" wireframe transparent opacity={0.15} />
      </Sphere>

      {/* Dotted Surface (Vertices) */}
      <points>
        <sphereGeometry args={[1, 64, 64]} />
        <pointsMaterial color="#22d3ee" size={0.015} transparent opacity={0.6} />
      </points>

      {/* Inner Core (Hologram solid) */}
      <Sphere ref={coreRef} args={[0.85, 24, 24]}>
        <meshBasicMaterial color="#0891b2" transparent opacity={0.1} wireframe={true} />
      </Sphere>

      {/* Outer Orbital Rings */}
      <group ref={ringsRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.4, 0.01, 16, 100]} />
            <meshBasicMaterial color="#cyan" transparent opacity={0.3} />
        </mesh>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
            <torusGeometry args={[1.2, 0.01, 16, 100]} />
            <meshBasicMaterial color="#cyan" transparent opacity={0.2} />
        </mesh>
      </group>
      
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#06b6d4" />
    </group>
  );
};