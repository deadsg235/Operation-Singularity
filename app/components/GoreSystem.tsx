"use client";

import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";

interface BloodParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
}

export function BloodSplatter({ position, normal, intensity = 20 }: {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  intensity?: number;
}) {
  const particlesRef = useRef<THREE.Points>(null);
  const [particles, setParticles] = useState<BloodParticle[]>(() => {
    const newParticles: BloodParticle[] = [];
    
    for (let i = 0; i < intensity; i++) {
      const spread = 2.0;
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * spread,
        Math.random() * spread * 0.5,
        (Math.random() - 0.5) * spread
      );
      
      velocity.add(normal.clone().multiplyScalar(Math.random() * 0.5));
      
      newParticles.push({
        position: position.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2
        )),
        velocity,
        life: 1.0,
        maxLife: 1.0 + Math.random() * 2.0,
        size: 0.05 + Math.random() * 0.1
      });
    }
    
    return newParticles;
  });

  useFrame((state, delta) => {
    if (!particlesRef.current) return;

    const positions = new Float32Array(particles.length * 3);
    const colors = new Float32Array(particles.length * 3);
    const sizes = new Float32Array(particles.length);
    
    let activeParticles = 0;
    
    particles.forEach((particle, i) => {
      if (particle.life <= 0) return;
      
      particle.velocity.y -= 9.8 * delta;
      particle.velocity.multiplyScalar(0.98);
      particle.position.add(particle.velocity.clone().multiplyScalar(delta));
      
      particle.life -= delta;
      const lifeRatio = particle.life / particle.maxLife;
      
      positions[activeParticles * 3] = particle.position.x;
      positions[activeParticles * 3 + 1] = particle.position.y;
      positions[activeParticles * 3 + 2] = particle.position.z;
      
      const red = 0.8 * lifeRatio;
      const green = 0.1 * lifeRatio;
      const blue = 0.05 * lifeRatio;
      
      colors[activeParticles * 3] = red;
      colors[activeParticles * 3 + 1] = green;
      colors[activeParticles * 3 + 2] = blue;
      
      sizes[activeParticles] = particle.size * lifeRatio;
      
      activeParticles++;
    });
    
    const geometry = particlesRef.current.geometry;
    geometry.setAttribute('position', new THREE.BufferAttribute(positions.slice(0, activeParticles * 3), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors.slice(0, activeParticles * 3), 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes.slice(0, activeParticles), 1));
    
    setParticles(prev => prev.filter(p => p.life > 0));
  });

  if (particles.length === 0) return null;

  return (
    <points ref={particlesRef}>
      <bufferGeometry />
      <pointsMaterial
        size={0.1}
        transparent
        opacity={0.9}
        vertexColors
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

export function MuzzleFlash({ position, direction, visible }: {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  visible: boolean;
}) {
  const flashRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (flashRef.current && visible) {
      flashRef.current.lookAt(position.clone().add(direction));
      flashRef.current.scale.setScalar(0.8 + Math.random() * 0.4);
    }
  });

  if (!visible) return null;

  return (
    <mesh ref={flashRef} position={position}>
      <coneGeometry args={[0.15, 0.4, 8]} />
      <meshBasicMaterial 
        color="#ffff88" 
        transparent 
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}