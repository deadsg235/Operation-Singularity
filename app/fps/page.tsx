"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { soundSystem } from "../components/SoundSystem";
import { BloodSplatter, MuzzleFlash } from "../components/GoreSystem";
import { AdvancedDrone } from "../components/EnemyAI";
import { PowerUpItem, PowerUp } from "../components/PowerUps";
import { HUD } from "../components/HUD";

// -----------------------------
// CONFIG
// -----------------------------
const PLAYER = {
  maxHealth: 100,
  maxShield: 50,
  damageFlashTime: 200,
  moveSpeed: 0.15,
  shieldRegenRate: 10,
};

const ENEMY = {
  speed: 0.04,
  damage: 15,
  spawnRate: 2000,
};

const GUN = {
  fireCooldown: 80,
  maxAmmo: 30,
  recoil: 0.04,
  damage: 35,
};

const EFFECTS = {
  screenShakeDuration: 100,
  bloodParticles: 15,
  muzzleFlashDuration: 60,
};

// -----------------------------
// ENEMY DRONE
// -----------------------------


// -----------------------------
// GUN + SHOOTING
// -----------------------------
function Gun({ onShoot }: { onShoot: (dir: THREE.Vector3) => void }) {
  const gun = useRef<THREE.Mesh>(null);
  const muzzleFlash = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const cooldown = useRef(0);
  const [showMuzzleFlash, setShowMuzzleFlash] = useState(false);
  const recoilOffset = useRef({ x: 0, y: 0 });
  const isMouseDown = useRef(false);

  useFrame(() => {
    cooldown.current -= 1;

    // Smooth recoil recovery
    recoilOffset.current.x *= 0.85;
    recoilOffset.current.y *= 0.85;

    if (gun.current) {
      gun.current.position.set(
        0.4 + recoilOffset.current.x, 
        -0.3 + recoilOffset.current.y, 
        -1
      );
      gun.current.rotation.set(recoilOffset.current.y * 2, 0, 0);
    }

    // Auto-fire when mouse held down
    if (isMouseDown.current && cooldown.current <= 0) {
      shoot();
    }
  });

  const shoot = () => {
    if (cooldown.current > 0) return;
    cooldown.current = GUN.fireCooldown;

    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    // Enhanced recoil with randomness
    const recoilStrength = GUN.recoil + Math.random() * 0.02;
    camera.rotation.x -= recoilStrength;
    camera.rotation.y += (Math.random() - 0.5) * 0.01;
    
    // Gun kick animation
    recoilOffset.current.x = (Math.random() - 0.5) * 0.1;
    recoilOffset.current.y = -0.05;

    // Muzzle flash
    setShowMuzzleFlash(true);
    setTimeout(() => setShowMuzzleFlash(false), EFFECTS.muzzleFlashDuration);

    // Play gunshot sound
    playGunshot();

    onShoot(direction);
  };

  const playGunshot = () => {
    soundSystem.playGunshot(0.4);
  };

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDown.current = true;
        shoot();
      }
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDown.current = false;
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <group>
      <mesh ref={gun}>
        <boxGeometry args={[0.15, 0.08, 0.8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>
      {showMuzzleFlash && (
        <mesh ref={muzzleFlash} position={[0.4, -0.25, -1.4]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="#ffff88" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}

// -----------------------------
// MAIN GAME WRAPPER
// -----------------------------
function Game() {
  const { camera, scene } = useThree();
  const [health, setHealth] = useState(PLAYER.maxHealth);
  const [shield, setShield] = useState(PLAYER.maxShield);
  const [score, setScore] = useState(0);
  const [ammo, setAmmo] = useState(GUN.maxAmmo);
  const [damageFlash, setDamageFlash] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [wave, setWave] = useState(1);
  const [waveActive, setWaveActive] = useState(true);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [damageBoost, setDamageBoost] = useState(1);
  const [speedBoost, setSpeedBoost] = useState(1);
  const [drones, setDrones] = useState<Array<{
    key: number;
    pos: [number, number, number];
    difficulty: number;
  }>>([]);
  const [bloodSplatters, setBloodSplatters] = useState<Array<{
    key: number;
    position: THREE.Vector3;
    normal: THREE.Vector3;
  }>>([]);
  const [muzzleFlashVisible, setMuzzleFlashVisible] = useState(false);
  const [muzzlePosition, setMuzzlePosition] = useState(new THREE.Vector3());
  const [muzzleDirection, setMuzzleDirection] = useState(new THREE.Vector3());
  const bloodParticles = useRef<THREE.Points[]>([]);

  // Wave system
  useEffect(() => {
    if (waveActive && drones.length === 0) {
      // Start new wave
      const enemyCount = 5 + (wave * 2);
      const newDrones = Array.from({ length: enemyCount }).map((_, i) => ({
        key: Date.now() + i,
        pos: [(Math.random() - 0.5) * 40, 1, Math.random() * -30 - 15] as [number, number, number],
        difficulty: Math.min(Math.floor(wave / 2) + 1, 4),
      }));
      setDrones(newDrones);
      
      // Spawn power-ups every few waves
      if (wave % 3 === 0) {
        const powerUpTypes: Array<'health' | 'shield' | 'damage' | 'speed'> = ['health', 'shield', 'damage', 'speed'];
        const newPowerUp: PowerUp = {
          id: `powerup-${Date.now()}`,
          type: powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)],
          position: new THREE.Vector3((Math.random() - 0.5) * 20, 1, (Math.random() - 0.5) * 20),
          collected: false
        };
        setPowerUps(prev => [...prev, newPowerUp]);
      }
    }
  }, [drones.length, wave, waveActive]);

  const handleHitPlayer = () => {
    const damage = ENEMY.damage;
    if (shield > 0) {
      setShield((s) => Math.max(0, s - damage));
    } else {
      setHealth((h) => Math.max(0, h - damage));
    }

    soundSystem.playPlayerHit(0.3);
    
    // Screen shake on damage
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), EFFECTS.screenShakeDuration);
    
    setDamageFlash(true);
    setTimeout(() => setDamageFlash(false), PLAYER.damageFlashTime);
  };

  const handleShoot = (dir: THREE.Vector3) => {
    if (ammo <= 0) return;
    setAmmo(a => Math.max(0, a - 1));

    setMuzzlePosition(camera.position.clone().add(new THREE.Vector3(0.4, -0.3, -1)));
    setMuzzleDirection(dir.clone());
    setMuzzleFlashVisible(true);
    setTimeout(() => setMuzzleFlashVisible(false), EFFECTS.muzzleFlashDuration);

    const ray = new THREE.Raycaster(camera.position, dir);
    const hits = ray.intersectObjects(scene.children, true);

    if (hits.length) {
      const hit = hits[0];
      const hitObject = hit.object;
      
      if (hitObject.userData.enemy && (hitObject as any).takeDamage) {
        (hitObject as any).takeDamage(GUN.damage * damageBoost);
        
        setBloodSplatters(prev => [...prev, {
          key: Date.now() + Math.random(),
          position: hit.point.clone(),
          normal: hit.face?.normal || new THREE.Vector3(0, 1, 0),
        }]);
        
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 50);
      }
    }
  };

  const handleDroneDestroy = () => {
    soundSystem.playEnemyDeath(0.25);
    setScore(s => s + (100 * wave));
    setDrones(prev => prev.slice(0, -1));
    
    // Check if wave complete
    if (drones.length === 1) {
      setWave(w => w + 1);
      setTimeout(() => setWaveActive(true), 2000);
    }
  };

  const handlePowerUpCollect = (id: string, type: string) => {
    setPowerUps(prev => prev.map(p => p.id === id ? { ...p, collected: true } : p));
    
    switch (type) {
      case 'health':
        setHealth(h => Math.min(PLAYER.maxHealth, h + 50));
        break;
      case 'shield':
        setShield(s => PLAYER.maxShield);
        break;
      case 'damage':
        setDamageBoost(2);
        setTimeout(() => setDamageBoost(1), 10000);
        break;
      case 'speed':
        setSpeedBoost(2);
        setTimeout(() => setSpeedBoost(1), 8000);
        break;
    }
  };

  // Clean up old blood splatters
  useEffect(() => {
    const cleanup = setInterval(() => {
      setBloodSplatters(prev => prev.slice(-10)); // Keep only last 10 splatters
    }, 5000);
    return () => clearInterval(cleanup);
  }, []);

  // Auto-reload when ammo is empty
  useEffect(() => {
    if (ammo === 0) {
      const reloadTimer = setTimeout(() => {
        setAmmo(GUN.maxAmmo);
      }, 1500);
      return () => clearTimeout(reloadTimer);
    }
  }, [ammo]);

  // Movement and shield regen
  useFrame((state, delta) => {
    const keys = (window as any).keys || {};
    const moveSpeed = PLAYER.moveSpeed * speedBoost;
    
    if (keys['KeyW']) camera.translateZ(-moveSpeed);
    if (keys['KeyS']) camera.translateZ(moveSpeed);
    if (keys['KeyA']) camera.translateX(-moveSpeed);
    if (keys['KeyD']) camera.translateX(moveSpeed);
    
    if (camera.position.y < 1.6) camera.position.y = 1.6;
    
    // Shield regeneration
    setShield(s => Math.min(PLAYER.maxShield, s + PLAYER.shieldRegenRate * delta));
  });

  // Keyboard input handling
  useEffect(() => {
    const keys: { [key: string]: boolean } = {};
    (window as any).keys = keys;

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <>
      <HUD
        health={Math.round(health)}
        maxHealth={PLAYER.maxHealth}
        shield={Math.round(shield)}
        maxShield={PLAYER.maxShield}
        ammo={ammo}
        maxAmmo={GUN.maxAmmo}
        score={score}
        wave={wave}
        enemiesLeft={drones.length}
        screenShake={screenShake}
        damageFlash={damageFlash}
      />

      {/* Enhanced lighting */}
      <ambientLight intensity={0.3} color="#440044" />
      <directionalLight position={[10, 15, 10]} intensity={1.5} color="#ffffff" castShadow />
      <pointLight position={[0, 5, 0]} intensity={0.8} color="#ff4444" distance={20} />

      {/* Atmospheric fog */}
      <fog attach="fog" args={["#000011", 10, 50]} />

      {/* Enhanced floor with grid pattern */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial 
          color="#111122" 
          metalness={0.1} 
          roughness={0.9}
        />
      </mesh>

      {/* Advanced enemies */}
      {drones.map((d) => (
        <AdvancedDrone
          key={d.key}
          position={d.pos}
          onHitPlayer={handleHitPlayer}
          onDestroy={handleDroneDestroy}
          difficulty={d.difficulty}
        />
      ))}

      {/* Blood splatters */}
      {bloodSplatters.map((splatter) => (
        <BloodSplatter
          key={splatter.key}
          position={splatter.position}
          normal={splatter.normal}
          intensity={25}
        />
      ))}

      {/* Power-ups */}
      {powerUps.map((powerUp) => (
        <PowerUpItem
          key={powerUp.id}
          powerUp={powerUp}
          onCollect={handlePowerUpCollect}
          playerPosition={camera.position}
        />
      ))}

      <MuzzleFlash
        position={muzzlePosition}
        direction={muzzleDirection}
        visible={muzzleFlashVisible}
      />

      <Gun onShoot={handleShoot} />
      <PointerLockControls />

      <style jsx global>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes pulse {
          0% { opacity: 0.6; }
          100% { opacity: 0; }
        }
      `}</style>
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
