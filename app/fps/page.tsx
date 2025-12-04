"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useRef, useState } from "react";

// -----------------------------
// CONFIG
// -----------------------------
const PLAYER = {
  health: 100,
  shield: 50,
  damageFlashTime: 150,
};

const ENEMY = {
  speed: 0.02,
  damage: 10,
};

const GUN = {
  fireCooldown: 120,
  maxAmmo: 30,
  recoil: 0.02,
};

// -----------------------------
// ENEMY DRONE
// -----------------------------
function Drone({ position, onHitPlayer }: any) {
  const mesh = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!mesh.current) return;

    const direction = new THREE.Vector3()
      .subVectors(camera.position, mesh.current.position)
      .normalize();

    mesh.current.position.add(direction.multiplyScalar(ENEMY.speed));

    if (mesh.current.position.distanceTo(camera.position) < 1.2) {
      onHitPlayer();
      mesh.current.position.set(
        Math.random() * 10 - 5,
        1,
        Math.random() * -10
      );
    }
  });

  return (
    <mesh ref={mesh} position={position}>
      <sphereGeometry args={[0.4, 16, 16]} />
      <meshStandardMaterial color="red" />
    </mesh>
  );
}

// -----------------------------
// GUN + SHOOTING
// -----------------------------
function Gun({ onShoot }: { onShoot: (dir: THREE.Vector3) => void }) {
  const gun = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const cooldown = useRef(0);

  useFrame(() => {
    cooldown.current -= 1;

    if (gun.current) {
      gun.current.position.set(0.4, -0.3, -1);
      gun.current.rotation.set(0, 0, 0);
    }
  });

  const shoot = () => {
    if (cooldown.current > 0) return;
    cooldown.current = GUN.fireCooldown;

    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    // recoil
    camera.rotation.x -= GUN.recoil;

    onShoot(direction);
  };

  useEffect(() => {
    window.addEventListener("mousedown", shoot);
    return () => window.removeEventListener("mousedown", shoot);
  });

  return (
    <mesh ref={gun}>
      <boxGeometry args={[0.2, 0.1, 0.7]} />
      <meshStandardMaterial color="black" />
    </mesh>
  );
}

// -----------------------------
// MAIN GAME WRAPPER
// -----------------------------
function Game() {
  const { camera } = useThree();
  const [health, setHealth] = useState(PLAYER.health);
  const [shield, setShield] = useState(PLAYER.shield);
  const [score, setScore] = useState(0);
  const [damageFlash, setDamageFlash] = useState(false);

  const drones = Array.from({ length: 6 }).map((_, i) => ({
    key: i,
    pos: [Math.random() * 10 - 5, 1, Math.random() * -10],
  }));

  const handleHitPlayer = () => {
    if (shield > 0) setShield((s) => Math.max(0, s - 10));
    else setHealth((h) => Math.max(0, h - 10));

    setDamageFlash(true);
    setTimeout(() => setDamageFlash(false), PLAYER.damageFlashTime);
  };

  const handleShoot = (dir: THREE.Vector3) => {
    const ray = new THREE.Raycaster(camera.position, dir);
    const hits = ray.intersectObjects(
      (window as any)._r3f_scene.children,
      true
    );

    if (hits.length) {
      const hit = hits[0].object;
      if (hit.userData.enemy) {
        hit.position.set(Math.random() * 10 - 5, 1, Math.random() * -10);
        setScore((s) => s + 1);
        bloodSplat(hit.position.clone());
      }
    }
  };

  const bloodSplat = (pos: THREE.Vector3) => {
    const amount = 20;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < amount; i++) {
      pts.push(
        new THREE.Vector3(
          pos.x + (Math.random() - 0.5) * 0.3,
          pos.y + (Math.random() - 0.5) * 0.3,
          pos.z + (Math.random() - 0.5) * 0.3
        )
      );
    }
  };

  return (
    <>
      {/* UI HUD */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "white",
          fontFamily: "monospace",
          zIndex: 5,
        }}
      >
        <div>Health: {health}</div>
        <div>Shield: {shield}</div>
        <div>Score: {score}</div>
      </div>

      {damageFlash && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,0,0,0.3)",
            zIndex: 10,
          }}
        />
      )}

      {/* LIGHTS */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />

      {/* FLOOR */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* ENEMIES */}
      {drones.map((d) => (
        <Drone
          key={d.key}
          position={d.pos}
          onHitPlayer={handleHitPlayer}
          userData={{ enemy: true }}
        />
      ))}

      <Gun onShoot={handleShoot} />

      <PointerLockControls />
    </>
  );
}

// -----------------------------
// PAGE EXPORT
// -----------------------------
export default function Page() {
  return (
    <Canvas
      onCreated={({ scene }) => {
        (window as any)._r3f_scene = scene;
      }}
    >
      <Game />
    </Canvas>
  );
}
