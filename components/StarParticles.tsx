import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StarStage } from '../types';

interface StarParticlesProps {
  stage: StarStage;
  gestureOpenness: number; // 0 to 1
}

const COUNT = 12000; // Increased count for better edge definition

export const StarParticles: React.FC<StarParticlesProps> = ({ stage, gestureOpenness }) => {
  const pointsRef = useRef<THREE.Points>(null);

  // Pre-calculate random spherical coordinates for every particle
  const { particleData, colors } = useMemo(() => {
    const data = new Float32Array(COUNT * 4); // x, y, z (base sphere coords), w (random phase)
    const cols = new Float32Array(COUNT * 3);
    
    // VFTS 352 is O-type: Very hot, Blue/White
    const colorInside = new THREE.Color('#a5f3fc'); // Cyan-ish white
    const colorOutside = new THREE.Color('#0284c7'); // Deep Sky Blue

    for (let i = 0; i < COUNT; i++) {
      // Distribution: Mix of Volume and Surface Shell to define edges clearly
      // 40% Volume (Uniform), 60% Surface Bias
      const isShell = Math.random() > 0.4; 
      let r;
      if (isShell) {
          // Concentrate near surface (0.85 to 1.0)
          r = 0.85 + Math.random() * 0.15;
      } else {
          // Uniform volume
          r = Math.cbrt(Math.random());
      }

      const theta = Math.acos(2 * Math.random() - 1);
      const phi = Math.random() * Math.PI * 2;

      // Convert to Cartesian (Unit Sphere)
      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(theta);

      data[i * 4] = x;
      data[i * 4 + 1] = y;
      data[i * 4 + 2] = z;
      data[i * 4 + 3] = Math.random(); // Random phase for twinkling

      // Color variation based on radius (hotter core)
      const mixRatio = r * 0.8 + Math.random() * 0.2;
      const c = colorInside.clone().lerp(colorOutside, mixRatio);
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }
    return { particleData: data, colors: cols };
  }, []);

  // Custom Texture for soft particle look
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.2, 'rgba(200, 240, 255, 0.8)');
      grad.addColorStop(0.5, 'rgba(64, 160, 255, 0.2)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.premultiplyAlpha = true;
    return tex;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const time = state.clock.getElapsedTime();
    const positions = pointsRef.current.geometry.attributes.position;
    
    // Hand Gesture Influence
    const expansion = 0.8 + (gestureOpenness * 0.4); 
    const turbulence = 0.05 + (gestureOpenness * 0.15);

    // Star Physics Parameters
    let separation = 2.5;
    let starRadius = 1.3;
    let rotationSpeed = 0.5;

    if (stage === StarStage.SEPARATED) {
        separation = 2.8;
        starRadius = 1.2;
    } else if (stage === StarStage.CONTACT) {
        separation = 1.6; // Close enough to touch
        starRadius = 1.3;
        rotationSpeed = 0.8; // System rotation speed
    } else if (stage === StarStage.MERGED) {
        separation = 0;
        starRadius = 2.2; 
        rotationSpeed = 0.5;
    } else if (stage === StarStage.BLACK_HOLE) {
        separation = 0;
        starRadius = 4.0;
        rotationSpeed = 2.0;
    }

    for (let i = 0; i < COUNT; i++) {
        const i4 = i * 4;
        const bx = particleData[i4];     // Base X
        const by = particleData[i4 + 1]; // Base Y
        const bz = particleData[i4 + 2]; // Base Z
        const rnd = particleData[i4 + 3];

        let finalX = 0, finalY = 0, finalZ = 0;

        // --- BLACK HOLE LOGIC ---
        if (stage === StarStage.BLACK_HOLE) {
            // Flatten sphere to disk
            const rawRadius = Math.sqrt(bx*bx + by*by + bz*bz);
            const diskRadius = 1.2 + rawRadius * 3.5; 
            
            const speed = (rotationSpeed * 5) / diskRadius; 
            const angle = time * speed + rnd * Math.PI * 2;

            // Spiral/Accretion shape
            finalX = Math.cos(angle) * diskRadius * expansion;
            finalZ = Math.sin(angle) * diskRadius * expansion;
            finalY = (by * 0.1) + Math.sin(angle * 3 + time * 2) * 0.1 * expansion;

            // Event Horizon Glitch
            if (rawRadius < 0.2) {
                finalY *= 5; 
                finalX *= 0.2;
                finalZ *= 0.2;
            }

        } else {
            // --- STAR LOGIC ---
            
            const isStarA = i % 2 === 0;
            const dir = isStarA ? -1 : 1;
            
            // Center of the specific star on the X-axis
            let centerX = dir * (separation / 2);
            
            // Transform base sphere point
            let px = bx * starRadius * expansion;
            let py = by * starRadius * expansion;
            let pz = bz * starRadius * expansion;

            // Deformation for "Kiss of Death" (Contact Stage)
            if (stage === StarStage.CONTACT) {
                // Tidal Pull towards center
                // We do NOT rotate the star locally. This keeps the "nose" of the teardrop
                // always pointing towards the other star (Tidal Locking).
                
                // If particle is on the inner face
                if ((isStarA && bx > 0) || (!isStarA && bx < 0)) {
                    // Strong pull near the axis
                    const distFromAxis = Math.sqrt(by*by + bz*bz);
                    const pullFactor = Math.max(0, 1 - distFromAxis * 1.5); // Stronger at center
                    
                    const stretch = 1.0 + (pullFactor * 0.8 * gestureOpenness); 
                    px *= stretch;
                    
                    // Pinch effect (neck constriction)
                    if (Math.abs(px) < 0.5) {
                        py *= 0.8;
                        pz *= 0.8;
                    }
                }
            }

            // Turbulence (Surface activity)
            // Added to final position to simulate plasma flow without rotating the shape envelope
            const noise = Math.sin(time * 3 + rnd * 20 + px) * turbulence;
            px += noise;
            py += noise;
            pz += noise;

            // Final Position (No local rotation = Tidally Locked)
            finalX = centerX + px;
            finalY = py;
            finalZ = pz;
        }

        positions.setXYZ(i, finalX, finalY, finalZ);
    }
    
    positions.needsUpdate = true;

    // Rotate the entire system
    pointsRef.current.rotation.y = time * rotationSpeed;
  });

  return (
    <group>
        <points ref={pointsRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={COUNT}
              array={new Float32Array(COUNT * 3)}
              itemSize={3}
            />
            <bufferAttribute 
              attach="attributes-color"
              count={COUNT}
              array={colors}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.12}
            map={texture}
            vertexColors
            transparent
            opacity={0.9}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            sizeAttenuation={true}
          />
        </points>
        
        {/* Removed blue circle glow mesh to keep background black/clean */}
    </group>
  );
};
