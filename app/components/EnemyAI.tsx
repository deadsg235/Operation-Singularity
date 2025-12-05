"use client";

import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";

interface EnemyProps {
  position: [number, number, number];
  onHitPlayer: () => void;
  onDestroy: () => void;
  difficulty?: number;
}

export function AdvancedDrone({ position, onHitPlayer, onDestroy, difficulty = 1 }: EnemyProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const { camera, scene } = useThree();
  const [health, setHealth] = useState(100 * difficulty);
  const [isDead, setIsDead] = useState(false);
  const [isAttacking, setIsAttacking] = useState(false);
  
  const bobOffset = useRef(Math.random() * Math.PI * 2);
  const attackCooldown = useRef(0);
  const lastPosition = useRef(new THREE.Vector3(...position));
  const aggroRange = 15 * difficulty;
  const attackRange = 2.5;
  const speed = 0.03 + (difficulty * 0.01);

  useFrame((state, delta) => {
    if (!mesh.current || isDead) return;

    const enemyPos = mesh.current.position;
    const playerPos = camera.position;
    const distance = enemyPos.distanceTo(playerPos);
    
    attackCooldown.current -= delta;

    if (distance > aggroRange) {
      const patrolRadius = 3;
      const time = state.clock.elapsedTime * 0.5;
      enemyPos.x = lastPosition.current.x + Math.sin(time + bobOffset.current) * patrolRadius;
      enemyPos.z = lastPosition.current.z + Math.cos(time + bobOffset.current) * patrolRadius;
    } else if (distance > attackRange) {
      const direction = new THREE.Vector3()
        .subVectors(playerPos, enemyPos)
        .normalize();
      
      const evasion = new THREE.Vector3(
        Math.sin(state.clock.elapsedTime * 4) * 0.5,
        0,
        Math.cos(state.clock.elapsedTime * 3) * 0.5
      );
      
      direction.add(evasion.multiplyScalar(0.3));
      enemyPos.add(direction.multiplyScalar(speed));
      
      mesh.current.lookAt(playerPos.x, enemyPos.y, playerPos.z);
      setIsAttacking(false);
    } else {
      setIsAttacking(true);
      if (attackCooldown.current <= 0) {
        attackCooldown.current = 1.0 / difficulty;
        onHitPlayer();
        
        const lungeDirection = new THREE.Vector3()
          .subVectors(playerPos, enemyPos)
          .normalize()
          .multiplyScalar(0.5);
        enemyPos.add(lungeDirection);
      }
    }

    enemyPos.y = 1 + Math.sin(state.clock.elapsedTime * 4 + bobOffset.current) * 0.3;
    mesh.current.rotation.y += delta * 2;
    mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.2;
  });

  const takeDamage = (damage: number) => {
    const newHealth = health - damage;
    setHealth(newHealth);
    
    if (mesh.current) {
      const material = mesh.current.material as THREE.MeshStandardMaterial;
      material.emissive.setHex(0xff0000);
      setTimeout(() => {
        material.emissive.setHex(0x330000);
      }, 100);
    }
    
    if (newHealth <= 0 && !isDead) {
      setIsDead(true);
      onDestroy();
      
      if (mesh.current) {
        const deathTween = () => {
          let scale = 1;
          const animate = () => {
            scale -= 0.05;
            if (mesh.current && scale > 0) {
              mesh.current.scale.setScalar(scale);
              mesh.current.rotation.x += 0.2;
              mesh.current.rotation.z += 0.3;
              requestAnimationFrame(animate);
            } else if (mesh.current) {
              scene.remove(mesh.current);
            }
          };
          animate();
        };
        deathTween();
      }
    }
  };

  useEffect(() => {
    if (mesh.current) {
      (mesh.current as any).takeDamage = takeDamage;
    }
  }, [health]);

  if (isDead) return null;

  const healthRatio = health / (100 * difficulty);
  const baseColor = isAttacking ? 0xff0000 : 0xff0040;
  const currentColor = new THREE.Color(baseColor).lerp(new THREE.Color(0x660000), 1 - healthRatio);

  return (
    <group>
      <mesh ref={mesh} position={position} userData={{ enemy: true, health }} castShadow>
        <boxGeometry args={[0.8, 0.6, 0.8]} />
        <meshStandardMaterial 
          color={currentColor}
          metalness={0.8} 
          roughness={0.2}
          emissive={isAttacking ? "#ff0000" : "#330000"}
          emissiveIntensity={isAttacking ? 0.5 : 0.2}
        />
      </mesh>
      
      <mesh position={[position[0] - 0.2, position[1] + 0.1, position[2] + 0.4]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      <mesh position={[position[0] + 0.2, position[1] + 0.1, position[2] + 0.4]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      
      {healthRatio < 1 && (
        <group position={[position[0], position[1] + 0.8, position[2]]}>
          <mesh>
            <planeGeometry args={[0.8, 0.1]} />
            <meshBasicMaterial color="#333333" transparent opacity={0.8} />
          </mesh>
          <mesh position={[(-0.4 + (0.8 * healthRatio) / 2), 0, 0.001]}>
            <planeGeometry args={[0.8 * healthRatio, 0.08]} />
            <meshBasicMaterial color={healthRatio > 0.3 ? "#ff0000" : "#ffff00"} />
          </mesh>
        </group>
      )}
    </group>
  );
}