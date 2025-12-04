import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";

// Minimal single-file First-Person Shooter using Three.js and React
// - Punchy gunplay: raycast shooting, recoil, muzzle flash, audio
// - Shields + Health
// - AI rebellion theme baked into HUD text and enemy look
// - Simple gore: particle blood splatters
// Notes:
// 1) This component is intended for client-side only. If you use Next.js, import it dynamically with ssr: false.
// 2) For Vercel deploy: create a small Next.js app and mount this component in a client page, or use CRA/Vite.

export default function VercelFPS() {
  const mountRef = useRef(null);
  const rendererRef = useRef();
  const sceneRef = useRef();
  const cameraRef = useRef();
  const controlsRef = useRef();
  const enemiesRef = useRef([]);
  const particlesRef = useRef([]);

  const [health, setHealth] = useState(100);
  const [shield, setShield] = useState(50);
  const [ammo, setAmmo] = useState(30);
  const [isLocked, setIsLocked] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Scene / Camera / Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07070b);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.6, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const hemi = new THREE.HemisphereLight(0x8888ff, 0x220000, 0.6);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 10, 7);
    dir.castShadow = true;
    scene.add(dir);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(200, 200);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x111216 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Minimal crosshair
    const crosshair = document.createElement("div");
    crosshair.style.position = "absolute";
    crosshair.style.left = "50%";
    crosshair.style.top = "50%";
    crosshair.style.transform = "translate(-50%, -50%)";
    crosshair.style.width = "6px";
    crosshair.style.height = "6px";
    crosshair.style.borderRadius = "2px";
    crosshair.style.background = "rgba(255,255,255,0.9)";
    crosshair.style.zIndex = "10";
    mountRef.current.appendChild(crosshair);

    // Pointer Lock Controls
    const controls = new PointerLockControls(camera, renderer.domElement);
    controlsRef.current = controls;

    const blocker = document.createElement("div");
    blocker.style.position = "absolute";
    blocker.style.top = "0";
    blocker.style.left = "0";
    blocker.style.width = "100%";
    blocker.style.height = "100%";
    blocker.style.display = "flex";
    blocker.style.alignItems = "center";
    blocker.style.justifyContent = "center";
    blocker.style.zIndex = "9";
    mountRef.current.appendChild(blocker);

    const startBtn = document.createElement("button");
    startBtn.innerText = "ENGAGE: AI REBELLION";
    startBtn.style.padding = "14px 22px";
    startBtn.style.fontWeight = "700";
    startBtn.style.cursor = "pointer";
    blocker.appendChild(startBtn);

    startBtn.addEventListener("click", () => {
      controls.lock();
    });

    controls.addEventListener("lock", () => {
      blocker.style.display = "none";
      setIsLocked(true);
    });
    controls.addEventListener("unlock", () => {
      blocker.style.display = "flex";
      setIsLocked(false);
    });

    // Player collider placeholder
    const player = { velocity: new THREE.Vector3(), canJump: false };

    // Generate some enemies (AI drones)
    function spawnEnemy(pos) {
      const geo = new THREE.BoxGeometry(0.8, 0.6, 0.8);
      const mat = new THREE.MeshStandardMaterial({ color: 0xff0040, metalness: 0.6, roughness: 0.4 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.castShadow = true;
      mesh.userData = { hp: 30, alive: true };
      scene.add(mesh);
      enemiesRef.current.push(mesh);
      return mesh;
    }

    for (let i = 0; i < 8; i++) {
      const a = (Math.random() - 0.5) * 60;
      const b = (Math.random() - 0.5) * 60;
      spawnEnemy(new THREE.Vector3(a, 1.2, b));
    }

    // Simple movement map - crates as cover
    for (let i = 0; i < 30; i++) {
      const cgeo = new THREE.BoxGeometry(2, 1.2, 2);
      const cmat = new THREE.MeshStandardMaterial({ color: 0x222233 });
      const crate = new THREE.Mesh(cgeo, cmat);
      crate.position.set((Math.random() - 0.5) * 80, 0.6, (Math.random() - 0.5) * 80);
      crate.receiveShadow = true;
      scene.add(crate);
    }

    // Raycaster for shooting
    const raycaster = new THREE.Raycaster();

    // Muzzle flash light
    const muzzle = new THREE.PointLight(0xffeeaa, 0, 6);
    camera.add(muzzle);
    scene.add(camera);

    // Audio beep for gun
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playGunshot() {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "square";
      o.frequency.setValueAtTime(900, audioCtx.currentTime);
      g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.15, audioCtx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + 0.15);
    }

    // Particle (gore) system
    function spawnBlood(position, normal, intensity = 6) {
      const pGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(intensity * 3);
      for (let i = 0; i < intensity; i++) {
        positions[i * 3 + 0] = position.x + (Math.random() - 0.5) * 0.6;
        positions[i * 3 + 1] = position.y + Math.random() * 0.6;
        positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.6;
      }
      pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const pMat = new THREE.PointsMaterial({ size: 0.12, transparent: true, opacity: 0.95, color: 0xaa0000 });
      const points = new THREE.Points(pGeo, pMat);
      points.userData = { life: 1.2 };
      scene.add(points);
      particlesRef.current.push(points);
    }

    // Shooting logic
    let lastShot = 0;
    const fireRate = 120; // ms between shots for rapid fire

    function shoot() {
      const now = performance.now();
      if (now - lastShot < fireRate) return;
      if (ammo <= 0) return;
      lastShot = now;
      setAmmo((a) => Math.max(0, a - 1));

      // Recoil: small camera bob
      camera.rotation.x -= 0.02 + Math.random() * 0.01;
      camera.rotation.y += (Math.random() - 0.5) * 0.001;

      playGunshot();

      // Muzzle flash
      muzzle.intensity = 2.5;
      setTimeout(() => (muzzle.intensity = 0), 50);

      const origin = camera.position.clone();
      const dirVec = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      raycaster.set(origin, dirVec);
      const hits = raycaster.intersectObjects(enemiesRef.current, false);
      if (hits.length > 0) {
        const h = hits[0];
        const enemy = h.object;
        if (enemy.userData.alive) {
          enemy.userData.hp -= 18; // punchy damage
          spawnBlood(h.point, h.face.normal, 12);
          if (enemy.userData.hp <= 0) {
            enemy.userData.alive = false;
            // explode-ish: scale down and remove
            const idx = enemiesRef.current.indexOf(enemy);
            if (idx !== -1) enemiesRef.current.splice(idx, 1);
            setScore((s) => s + 100);
            scene.remove(enemy);
          }
        }
      }
    }

    // Enemy AI simple: move toward player, attack if close
    function enemyAI(delta) {
      for (const e of enemiesRef.current) {
        if (!e.userData.alive) continue;
        const toPlayer = camera.position.clone().sub(e.position);
        const dist = toPlayer.length();
        toPlayer.normalize();
        // Move faster when far
        const speed = dist > 10 ? 2.5 : 1.2;
        e.position.addScaledVector(toPlayer, speed * delta);

        // Face the player
        e.lookAt(camera.position.x, e.position.y, camera.position.z);

        // If close, hit player
        if (dist < 2.0) {
          // punchy damage, but with a cooldown
          if (!e.userData._lastHit || performance.now() - e.userData._lastHit > 800) {
            e.userData._lastHit = performance.now();
            // Shields absorb first
            if (shield > 0) {
              setShield((s) => Math.max(0, s - 12));
            } else {
              setHealth((h) => Math.max(0, h - 18));
            }
            // blood on player: small screen flash
            const flash = document.createElement("div");
            flash.style.position = "absolute";
            flash.style.top = "0";
            flash.style.left = "0";
            flash.style.width = "100%";
            flash.style.height = "100%";
            flash.style.background = "rgba(150,0,0,0.16)";
            flash.style.pointerEvents = "none";
            mountRef.current.appendChild(flash);
            setTimeout(() => mountRef.current.removeChild(flash), 120);
          }
        }
      }
    }

    // Input handling
    const keys = {};
    function onKeyDown(e) {
      keys[e.code] = true;
    }
    function onKeyUp(e) {
      keys[e.code] = false;
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // Mouse to shoot
    renderer.domElement.addEventListener("mousedown", (ev) => {
      if (!isLocked) return;
      if (ev.button === 0) {
        shoot();
      }
    });

    // Animation loop
    let prev = performance.now();
    function animate() {
      const now = performance.now();
      const delta = Math.min(0.05, (now - prev) / 1000);
      prev = now;

      // Player movement
      const moveSpeed = 6.0;
      const forward = new THREE.Vector3();
      const right = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      right.crossVectors(camera.up, forward).normalize();

      let move = new THREE.Vector3();
      if (keys["KeyW"]) move.add(forward);
      if (keys["KeyS"]) move.sub(forward);
      if (keys["KeyA"]) move.sub(right);
      if (keys["KeyD"]) move.add(right);
      move.normalize();
      camera.position.addScaledVector(move, moveSpeed * delta);

      // Regenerate shield slowly
      setShield((s) => Math.min(50, s + 5 * delta));

      // Update enemies
      enemyAI(delta);

      // Update particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.userData.life -= delta;
        if (p.userData.life <= 0) {
          scene.remove(p);
          particlesRef.current.splice(i, 1);
        } else {
          // fade
          const mat = p.material;
          mat.opacity = Math.max(0, p.userData.life / 1.2);
        }
      }

      // Simple game-over
      if (health <= 0) {
        // show message
        controls.unlock();
        // remove loop
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();

    // Resize
    function onResize() {
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", onResize);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", onResize);
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  // HUD overlay in React (not repeated in canvas code)
  return (
    <div className="w-full h-screen relative bg-black" ref={mountRef}>
      {/* HUD */}
      <div style={{ position: "absolute", left: 16, top: 12, zIndex: 20, color: "#fff" }}>
        <div style={{ fontWeight: 700 }}>AI Rebellion — Frontline</div>
        <div>Health: <span style={{ color: health > 30 ? "#8ef" : "#f66" }}>{Math.round(health)}</span></div>
        <div>Shield: <span style={{ color: shield > 15 ? "#7ff" : "#ff9" }}>{Math.round(shield)}</span></div>
        <div>Ammo: {ammo}</div>
        <div>Score: {score}</div>
      </div>

      {/* Simple bottom-right weapon/status */}
      <div style={{ position: "absolute", right: 20, bottom: 20, zIndex: 20, color: "#fff", textAlign: "right" }}>
        <div style={{ fontSize: 13, opacity: 0.9 }}>Pulse Rifle — Rapid</div>
        <div style={{ fontSize: 11, opacity: 0.7 }}>Click = Fire · WASD to move · Esc to unlock</div>
      </div>

      {/* Small center instruction when unlocked state false */}
      {!isLocked && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 80, textAlign: "center", color: "#fff", zIndex: 9 }}>
          <div style={{ opacity: 0.9 }}>Click <strong>ENGAGE: AI REBELLION</strong> to lock pointer and start</div>
        </div>
      )}
    </div>
  );
}
