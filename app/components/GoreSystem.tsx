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
      
      // Add some influence from the surface normal
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
      });\n    }\n    \n    return newParticles;\n  });\n\n  useFrame((state, delta) => {\n    if (!particlesRef.current) return;\n\n    const positions = new Float32Array(particles.length * 3);\n    const colors = new Float32Array(particles.length * 3);\n    const sizes = new Float32Array(particles.length);\n    \n    let activeParticles = 0;\n    \n    particles.forEach((particle, i) => {\n      if (particle.life <= 0) return;\n      \n      // Physics\n      particle.velocity.y -= 9.8 * delta; // gravity\n      particle.velocity.multiplyScalar(0.98); // air resistance\n      particle.position.add(particle.velocity.clone().multiplyScalar(delta));\n      \n      // Life\n      particle.life -= delta;\n      const lifeRatio = particle.life / particle.maxLife;\n      \n      // Position\n      positions[activeParticles * 3] = particle.position.x;\n      positions[activeParticles * 3 + 1] = particle.position.y;\n      positions[activeParticles * 3 + 2] = particle.position.z;\n      \n      // Color (dark red to black)\n      const red = 0.8 * lifeRatio;\n      const green = 0.1 * lifeRatio;\n      const blue = 0.05 * lifeRatio;\n      \n      colors[activeParticles * 3] = red;\n      colors[activeParticles * 3 + 1] = green;\n      colors[activeParticles * 3 + 2] = blue;\n      \n      // Size\n      sizes[activeParticles] = particle.size * lifeRatio;\n      \n      activeParticles++;\n    });\n    \n    // Update geometry\n    const geometry = particlesRef.current.geometry;\n    geometry.setAttribute('position', new THREE.BufferAttribute(positions.slice(0, activeParticles * 3), 3));\n    geometry.setAttribute('color', new THREE.BufferAttribute(colors.slice(0, activeParticles * 3), 3));\n    geometry.setAttribute('size', new THREE.BufferAttribute(sizes.slice(0, activeParticles), 1));\n    \n    // Remove dead particles\n    setParticles(prev => prev.filter(p => p.life > 0));\n  });\n\n  if (particles.length === 0) return null;\n\n  return (\n    <points ref={particlesRef}>\n      <bufferGeometry />\n      <pointsMaterial\n        size={0.1}\n        transparent\n        opacity={0.9}\n        vertexColors\n        blending={THREE.AdditiveBlending}\n        sizeAttenuation\n      />\n    </points>\n  );\n}\n\nexport function MuzzleFlash({ position, direction, visible }: {\n  position: THREE.Vector3;\n  direction: THREE.Vector3;\n  visible: boolean;\n}) {\n  const flashRef = useRef<THREE.Mesh>(null);\n  \n  useFrame(() => {\n    if (flashRef.current && visible) {\n      flashRef.current.lookAt(position.clone().add(direction));\n      flashRef.current.scale.setScalar(0.8 + Math.random() * 0.4);\n    }\n  });\n\n  if (!visible) return null;\n\n  return (\n    <mesh ref={flashRef} position={position}>\n      <coneGeometry args={[0.15, 0.4, 8]} />\n      <meshBasicMaterial \n        color=\"#ffff88\" \n        transparent \n        opacity={0.8}\n        blending={THREE.AdditiveBlending}\n      />\n    </mesh>\n  );\n}