import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useApp } from '../../context/AppContext';
import { ServiceItem } from '../../services/types';

interface ServiceNodeProps {
  service: ServiceItem;
  position: [number, number, number];
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const ServiceNode: React.FC<ServiceNodeProps> = ({ service, position, isSelected, onSelect }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Status-driven color
  const statusColor = useMemo(() => {
    if (service.status === 'critical') return '#f43f5e'; // Rose
    if (service.status === 'degraded') return '#f59e0b'; // Amber
    return '#10b981'; // Emerald
  }, [service.status]);

  useFrame((state) => {
    if (meshRef.current) {
      if (service.status === 'critical') {
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 8) * 0.08;
      } else {
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.04;
      }
    }
  });

  // Calculate replica pod offsets
  const podCount = service.replicas || 1;
  const podOffsets = useMemo(() => {
    const offsets: [number, number, number][] = [];
    const radius = 1.1;
    for (let i = 0; i < Math.min(8, podCount); i++) {
      const angle = (i / Math.min(8, podCount)) * Math.PI * 2;
      offsets.push([Math.cos(angle) * radius, 0.4 + (i % 2) * 0.2, Math.sin(angle) * radius]);
    }
    return offsets;
  }, [podCount]);

  return (
    <group position={position}>
      {/* Central Service Core Box */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(service.id);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={() => setHovered(false)}
        >
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshStandardMaterial
            color={isSelected ? '#06b6d4' : '#141b2d'}
            emissive={statusColor}
            emissiveIntensity={hovered || isSelected ? 0.8 : 0.35}
            roughness={0.2}
            metalness={0.8}
            wireframe={false}
          />
        </mesh>
      </Float>

      {/* Dynamic Pod Replicas Orbiting */}
      {podOffsets.map((offset, idx) => (
        <mesh key={idx} position={offset}>
          <boxGeometry args={[0.24, 0.24, 0.24]} />
          <meshStandardMaterial
            color={statusColor}
            emissive={statusColor}
            emissiveIntensity={0.5}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* Floating Service Label */}
      <Text
        position={[0, -0.9, 0]}
        fontSize={0.28}
        color={isSelected ? '#22d3ee' : '#cbd5e1'}
        anchorX="center"
        anchorY="middle"
      >
        {service.name.split(' ')[0]}
      </Text>
      <Text
        position={[0, -1.2, 0]}
        fontSize={0.18}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        {`${service.replicas} pods • ${service.cpu_percent}% CPU`}
      </Text>
    </group>
  );
};

// Animated Traffic Flow Particles
const TrafficParticles: React.FC<{ active: boolean }> = ({ active }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = active ? 240 : 80;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = Math.random() * 2 + 0.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return pos;
  }, [particleCount]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      const array = pointsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        // Move particles along Z axis from user ingress (+Z) towards database (-Z)
        array[i * 3 + 2] -= delta * (active ? 4.5 : 1.8);
        if (array[i * 3 + 2] < -4.5) {
          array[i * 3 + 2] = 4.5;
          array[i * 3] = (Math.random() - 0.5) * 6;
        }
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color={active ? '#22d3ee' : '#38bdf8'}
        transparent
        opacity={0.7}
      />
    </points>
  );
};

// Main 3D Canvas Scene
export const InfrastructureScene3D: React.FC<{
  onSelectService: (id: string) => void;
  selectedId: string | null;
}> = ({ onSelectService, selectedId }) => {
  const { services, simulator } = useApp();
  const controlsRef = useRef<any>(null);

  // Layout positions for microservices
  const nodePositions: Record<string, [number, number, number]> = {
    'api-gateway': [0, 0.8, 3.5],
    'auth-service': [-3.2, 0.5, 0.8],
    'order-service': [-1.1, 0.5, 0.2],
    'inventory-service': [1.1, 0.5, 0.2],
    'payment-service': [3.2, 0.5, 0.8],
    'postgres-db': [-2.0, 0.2, -3.2],
    'redis-cache': [2.0, 0.2, -3.2],
  };

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="relative w-full h-[640px] rounded-xl overflow-hidden bg-[#07090e] border border-border">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 8, 9], fov: 45 }}
        onPointerMissed={() => onSelectService('')}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} />
        <pointLight position={[0, 4, 0]} intensity={2.0} color="#06b6d4" distance={10} />

        {/* Orbit Controls */}
        <OrbitControls
          ref={controlsRef}
          enablePan
          enableZoom
          enableRotate
          maxPolarAngle={Math.PI / 2.05} // don't go below ground
          minDistance={4}
          maxDistance={18}
        />

        {/* Cyber / Tech Grid Floor */}
        <gridHelper args={[24, 24, '#1e293b', '#0f172a']} position={[0, -0.6, 0]} />

        {/* Traffic Flow Particles */}
        <TrafficParticles active={simulator?.is_running || false} />

        {/* Service Nodes */}
        {services.map((svc) => {
          const pos = nodePositions[svc.id] || [0, 0, 0];
          return (
            <ServiceNode
              key={svc.id}
              service={svc}
              position={pos}
              isSelected={selectedId === svc.id}
              onSelect={onSelectService}
            />
          );
        })}
      </Canvas>

      {/* Overlay UI Controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-lg bg-surface-100/80 backdrop-blur-md border border-border text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-slate-300 font-mono">WebGL Three.js Engine</span>
        </div>
        <button
          onClick={resetCamera}
          className="px-2.5 py-1.5 rounded-lg bg-surface-100/80 hover:bg-surface-200 border border-border text-slate-300 text-xs font-mono transition-colors"
        >
          Reset Camera
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-10 text-[11px] text-slate-400 font-mono bg-surface-100/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border">
        Left-click + drag: Rotate • Scroll: Zoom • Right-click + drag: Pan • Click node: Inspect
      </div>
    </div>
  );
};
