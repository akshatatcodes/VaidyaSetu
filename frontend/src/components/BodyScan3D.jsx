import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { 
  Float, 
  PerspectiveCamera, 
  PointMaterial, 
  shaderMaterial,
  Text,
  Environment,
  useGLTF,
  Center
} from '@react-three/drei';
import * as THREE from 'three';
import { Lock } from 'lucide-react';

// Preload the model
useGLTF.preload('/Xbot.glb');

// CUSTOM HOLOGRAM SHADER
const HologramMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color('#10b981'),
    uFlicker: 0,
  },
  // Vertex Shader
  `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vViewPosition;

  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
  `,
  // Fragment Shader
  `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uFlicker;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vViewPosition;

  void main() {
    // Fresnel Effect (Rim Light)
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - dot(normal, viewDir), 2.5);
    
    // Horizontal Scanlines
    float scanline = sin(vPosition.y * 40.0 - uTime * 8.0) * 0.1 + 0.9;
    
    // Digital Pulse
    float pulse = sin(uTime * 2.5) * 0.05 + 0.95;
    
    // Interaction Glow
    float glow = fresnel * 1.5;
    
    // Alpha Logic
    float alpha = (fresnel * 0.5 + 0.1) * scanline * pulse;
    
    // Flicker Artifacting
    float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
    if (uFlicker > 0.5 && noise > 0.95) alpha *= 0.1;

    gl_FragColor = vec4(uColor, alpha);
  }
  `
);

extend({ HologramMaterial });

const HologramMannequin = ({ riskLevel = 0 }) => {
  const groupRef = useRef();
  const materialRef = useRef();
  const scanLineRef = useRef();
  const ringRef = useRef();
  const { scene } = useGLTF('/Xbot.glb');

  // Safe calculation to isolate memory without graph modification loops
  const modelProps = useMemo(() => {
    // Reset transforms to avoid Strict-Mode recursive shift bug
    scene.position.set(0, 0, 0);
    scene.scale.set(1, 1, 1);
    scene.rotation.set(0, 0, 0);
    scene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    const scale = 3.2 / (size.y || 1);

    // Flawless Blueprint Cyan Wireframe without crashing WebGL bindings
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: "#06b6d4",
      wireframe: true,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });

    scene.traverse((child) => {
      // Clean up any old duplicate wireframes if React hot-reloaded previously
      if (child.children) {
         child.children = child.children.filter(c => !c.userData?.isWireframeClone);
      }
      
      if (child.isMesh || child.isSkinnedMesh) {
         child.material = wireframeMaterial;
      }
    });

    return { scale, cx: center.x, cy: center.y, cz: center.z };
  }, [scene, riskLevel]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (materialRef.current) materialRef.current.uTime = t;
    
    // Professional medical rotation
    if (groupRef.current) groupRef.current.rotation.y = t * 0.25;
    
    // Rotating Orbital Rim (Outside the body)
    if (ringRef.current) {
        ringRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.5) * 0.2;
        ringRef.current.rotation.y = t * 1.5;
    }

    // Vertical Scanning Plane
    if (scanLineRef.current) {
      scanLineRef.current.position.y = Math.sin(t * 1.1) * 2.1;
    }
  });

  return (
    <group scale={0.75}> {/* Reduced size factor */}
      {/* Bio-Chamber Environment Elements */}
      <gridHelper args={[6, 12, "#10b981", "#020617"]} position={[0, -3.0, 0]} transparent opacity={0.08} />
      
      {/* Rotating Orbital Rim */}
      <mesh ref={ringRef} position={[0, 0.5, 0]}>
         <torusGeometry args={[1.2, 0.01, 16, 100]} />
         <meshBasicMaterial color="#10b981" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
      </mesh>

      <group ref={groupRef} rotation={[0, Math.PI / 6, 0]}>
        {/* The Mannequin dynamically scaled and centered in a parent group */}
        <group scale={modelProps.scale} position={[0, -0.6, 0]}>
           <primitive object={scene} position={[-modelProps.cx, -modelProps.cy, -modelProps.cz]} />
        </group>

        {/* Digital Core Points */}
        <points>
           <sphereGeometry args={[1.5, 32, 24]} />
           <PointMaterial color="#10b981" size={0.015} transparent opacity={0.04} blending={THREE.AdditiveBlending} />
        </points>
      </group>

      {/* Advanced Scanning Plane */}
      <mesh ref={scanLineRef}>
        <planeGeometry args={[3, 3]} />
        <meshBasicMaterial 
          color="#34d399" 
          transparent 
          opacity={0.08} 
          side={THREE.DoubleSide} 
          blending={THREE.AdditiveBlending}
        />
        {/* Beam Edge */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.45, 1.5, 64]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
        </mesh>
      </mesh>
    </group>
  );
};

const BodyScan3D = ({ riskScore = 0 }) => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <Canvas dpr={[1, 2]} className="w-full h-full"> 
        <PerspectiveCamera makeDefault position={[0, 0.2, 8]} fov={30} />
        <ambientLight intensity={0.4} />
        
        {/* LARGE Holographic Halo Background (Reference Match) */}
        <group position={[0, 0.2, -2.5]}>
          <mesh>
            <circleGeometry args={[3, 64]} />
            <meshBasicMaterial 
              color="#10b981" 
              transparent 
              opacity={0.02} 
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh position={[0, 0, 0.05]}>
            <ringGeometry args={[3, 3.02, 128]} />
            <meshBasicMaterial color="#10b981" transparent opacity={0.1} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>

        <React.Suspense fallback={null}>
          <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.2}>
            <HologramMannequin riskLevel={riskScore} />
          </Float>
        </React.Suspense>
      </Canvas>

      {/* HUD OVERLAY */}
      <div className="absolute inset-0 pointer-events-none p-12">
        <div className="absolute top-8 left-8 w-20 h-20 border-t border-l border-emerald-500/20 rounded-tl-[2rem]" />
        <div className="absolute top-8 right-8 w-20 h-20 border-t border-r border-emerald-500/20 rounded-tr-[2rem]" />
        <div className="absolute bottom-8 left-8 w-20 h-20 border-b border-l border-emerald-500/20 rounded-bl-[2rem]" />
        <div className="absolute bottom-8 right-8 w-20 h-20 border-b border-r border-emerald-500/20 rounded-br-[2rem]" />
        
        <div className="absolute top-14 left-0 right-0 flex items-start justify-center space-x-24 w-full px-20">
           <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-emerald-500/30 uppercase tracking-[0.5em] mb-2">Bio-Feedback</span>
              <div className="flex items-center space-x-2">
                 <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
                 <span className="text-[12px] font-black text-white/90 tracking-[0.2em]">SYNC</span>
              </div>
           </div>
           
           <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-emerald-500/30 uppercase tracking-[0.5em] mb-2">Encryption</span>
              <div className="flex items-center space-x-2">
                 <Lock className="w-3 h-3 text-emerald-500/60" />
                 <span className="text-[12px] font-black text-white/90 tracking-[0.2em]">AES</span>
              </div>
           </div>
        </div>
      </div>
      
      {/* Bottom Status Badge */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center pointer-events-none">
        <div className="flex items-center space-x-4 px-8 py-3 bg-black/40 border border-emerald-500/10 rounded-full shadow-[0_0_40px_rgba(16,185,129,0.1)]">
           <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_#10b981]" />
           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Biological Audit</span>
        </div>
      </div>
    </div>
  );
};

export default BodyScan3D;
