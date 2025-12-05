"use client";

import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

export interface PowerUp {
  id: string;
  type: 'health' | 'shield' | 'damage' | 'speed';
  position: THREE.Vector3;
  collected: boolean;
}

interface PowerUpProps {
  powerUp: PowerUp;
  onCollect: (id: string, type: string) => void;
  playerPosition: THREE.Vector3;
}

export function PowerUpItem({ powerUp, onCollect, playerPosition }: PowerUpProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current || powerUp.collected) return;

    meshRef.current.rotation.y += 0.02;
    meshRef.current.position.y = powerUp.position.y + Math.sin(state.clock.elapsedTime * 3) * 0.2;

    if (meshRef.current.position.distanceTo(playerPosition) < 1.5) {
      onCollect(powerUp.id, powerUp.type);
    }
  });

  if (powerUp.collected) return null;

  const colors = {
    health: "#00ff00",
    shield: "#00ffff", 
    damage: "#ff6600",
    speed: "#ffff00"
  };

  return (
    <mesh ref={meshRef} position={powerUp.position}>
      <boxGeometry args={[0.4, 0.4, 0.4]} />
      <meshStandardMaterial 
        color={colors[powerUp.type]} 
        emissive={colors[powerUp.type]}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}