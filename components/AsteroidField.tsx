import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const AsteroidField: React.FC = () => {
  const count = 1000;
  const meshRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const temp = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 20 + Math.random() * 30; // Distant shell
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      temp[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      temp[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      temp[i * 3 + 2] = r * Math.cos(phi);
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
        meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
        meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.1} color="#5577aa" transparent opacity={0.6} />
    </points>
  );
};