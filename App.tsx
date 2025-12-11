import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { GeminiLiveService } from './services/geminiLiveService';
import { StarParticles } from './components/StarParticles';
import { AsteroidField } from './components/AsteroidField';
import { UIOverlay } from './components/UIOverlay';
import { StarStage } from './types';

// Component to handle camera transitions
const CameraController: React.FC<{ stage: StarStage }> = ({ stage }) => {
  const { camera } = useThree();
  const vec = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    // Define target position based on stage
    if (stage === StarStage.BLACK_HOLE) {
      // Top-down view for Black Hole (High Y, essentially 0 X/Z)
      // Small Z offset prevents Gimbal lock in OrbitControls
      vec.current.set(0, 10, 0.1); 
    } else {
      // Standard angled view for other stages
      vec.current.set(0, 2, 8);
    }
    
    // Smoothly interpolate to target position
    // Using a factor of roughly 2.0 * delta gives a smooth transition taking about 1-2 seconds
    state.camera.position.lerp(vec.current, 2.0 * delta);
    
    // Ensure camera always points to center
    state.camera.lookAt(0, 0, 0);
  });
  return null;
};

const App: React.FC = () => {
  const [stage, setStage] = useState<StarStage>(StarStage.SEPARATED);
  const [openness, setOpenness] = useState<number>(0.5); // 0.0 to 1.0
  const [handDetected, setHandDetected] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const geminiServiceRef = useRef<GeminiLiveService | null>(null);

  // Initialize service on mount, but don't connect yet
  useEffect(() => {
    // Check for API Key
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API Key missing. Please set process.env.API_KEY");
      // In a real app, we might show a modal here.
    }

    geminiServiceRef.current = new GeminiLiveService(apiKey || '', (data) => {
      // Smoothly update state. The API might send jerky updates.
      // We will update the target, and let a requestAnimationFrame loop or CSS transition handle smoothing?
      // For React state, we'll just set it. The 3D component will interpolate this value visually.
      setOpenness(prev => {
        // Simple smoothing filter: 30% new, 70% old
        return prev * 0.7 + data.openness * 0.3;
      });
      setHandDetected(data.handDetected);
    });

    return () => {
      geminiServiceRef.current?.disconnect();
    };
  }, []);

  const handleConnect = async () => {
    if (!geminiServiceRef.current) return;

    try {
      // 1. Get Camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      
      // 2. Setup hidden video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // 3. Connect to Gemini
        await geminiServiceRef.current.connect(videoRef.current);
        setIsConnected(true);
      }
    } catch (err) {
      console.error("Failed to start camera or AI:", err);
      alert("Could not access camera or connect to Gemini API.");
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="w-full h-screen bg-[#050b14] relative">
      {/* Hidden Video for Gemini Processing */}
      <video ref={videoRef} className="hidden" muted playsInline />

      <UIOverlay 
        currentStage={stage} 
        setStage={setStage} 
        openness={openness} 
        isConnected={isConnected}
        handDetected={handDetected}
        onConnect={handleConnect}
        onFullscreen={handleFullscreen}
      />

      <Canvas camera={{ position: [0, 2, 8], fov: 60 }} dpr={[1, 2]}>
        <color attach="background" args={['#050b14']} />
        
        {/* Ambient visuals */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <AsteroidField />
        
        {/* Automatic Camera Adjustment */}
        <CameraController stage={stage} />

        {/* Main Subject */}
        <StarParticles stage={stage} gestureOpenness={openness} />

        {/* Lighting (mostly emissive, but adding some helps depth) */}
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#4fc3f7" />

        <OrbitControls enablePan={false} maxDistance={20} minDistance={4} />
      </Canvas>
    </div>
  );
};

export default App;