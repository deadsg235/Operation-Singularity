import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.Fog(0x000000, 10, 150);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 10;

// Audio
const listener = new THREE.AudioListener();
camera.add(listener);

const shootSound = new THREE.Audio(listener);
const hitSound = new THREE.Audio(listener);

const audioLoader = new THREE.AudioLoader();
audioLoader.load('sounds/shoot.mp3', function(buffer) {
    shootSound.setBuffer(buffer);
    shootSound.setVolume(0.5);
});
audioLoader.load('sounds/hit.mp3', function(buffer) {
    hitSound.setBuffer(buffer);
    hitSound.setVolume(0.5);
});


// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ReinhardToneMapping;
document.body.appendChild(renderer.domElement);

// Post-processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0;
bloomPass.strength = 0.8;
bloomPass.radius = 0;
composer.addPass(bloomPass);

// Controls
const controls = new PointerLockControls(camera, renderer.domElement);
const onKeyDown = (event) => {
    switch (event.code) {
        case 'KeyW':
            moveForward = true;
            break;
        case 'KeyA':
            moveLeft = true;
            break;
        case 'KeyS':
            moveBackward = true;
            break;
        case 'KeyD':
            moveRight = true;
            break;
    }
};

const onKeyUp = (event) => {
    switch (event.code) {
        case 'KeyW':
            moveForward = false;
            break;
        case 'KeyA':
            moveLeft = false;
            break;
        case 'KeyS':
            moveBackward = false;
            break;
        case 'KeyD':
            moveRight = false;
            break;
    }
};

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

renderer.domElement.addEventListener('click', () => {
    if (controls.isLocked) {
        shoot();
    } else {
        controls.lock();
    }
});

// Floor
const floorGeometry = new THREE.PlaneGeometry(500, 500, 100, 100);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.4 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// City
const buildings = [];
function createCity() {
    const buildingGeometry = new THREE.BoxGeometry(1, 1, 1);
    for (let i = 0; i < 200; i++) {
        const buildingMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 0.9,
            roughness: 0.3
        });

        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);

        building.scale.x = Math.random() * 10 + 5;
        building.scale.z = Math.random() * 10 + 5;
        building.scale.y = Math.random() * 100 + 20;

        building.position.x = Math.random() * 400 - 200;
        building.position.z = Math.random() * 400 - 200;
        building.position.y = building.scale.y / 2;

        scene.add(building);
        buildings.push(building);

        // Neon signs
        if (Math.random() > 0.7) {
            const signGeometry = new THREE.PlaneGeometry(building.scale.x, 5);
            const signColor = new THREE.Color(Math.random() * 0xffffff);
            const signMaterial = new THREE.MeshBasicMaterial({ color: signColor, side: THREE.DoubleSide });
            const sign = new THREE.Mesh(signGeometry, signMaterial);

            sign.position.x = building.position.x;
            sign.position.z = building.position.z;
            sign.position.y = Math.random() * (building.scale.y - 10) + 5;

            sign.rotation.y = Math.random() * Math.PI;

            scene.add(sign);

            const signLight = new THREE.PointLight(signColor, 1, 30);
            signLight.position.copy(sign.position);
            scene.add(signLight);
        }
    }
}
createCity();

// Gun
const gun = new THREE.Group();
const gunMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.5 });

const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 1), gunMaterial);
gunBody.position.set(0.5, -0.2, -1);
gun.add(gunBody);

const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 32), gunMaterial);
gunBarrel.position.set(0.5, -0.2, -1.5);
gun.add(gunBarrel);

const gunGrip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.2), gunMaterial);
gunGrip.position.set(0.5, -0.5, -0.8);
gun.add(gunGrip);

camera.add(gun);
scene.add(camera);

// Muzzle Flash
const muzzleFlash = new THREE.PointLight(0xffffff, 100, 20);
muzzleFlash.position.set(0.5, -0.2, -1.75);
muzzleFlash.visible = false;
gun.add(muzzleFlash);

// Enemies
const enemies = [];
function spawnEnemies() {
    const enemyGeometry = new THREE.BoxGeometry(2, 2, 2);
    for (let i = 0; i < 10; i++) {
        const enemyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.8, roughness: 0.2 });
        const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);

        enemy.position.x = Math.random() * 300 - 150;
        enemy.position.z = Math.random() * 300 - 150;
        enemy.position.y = 1;

        enemy.health = 100;

        scene.add(enemy);
        enemies.push(enemy);
    }
}
spawnEnemies();

// Shooting
const raycaster = new THREE.Raycaster();
const bulletTracers = [];
function shoot() {
    if (shootSound.isPlaying) shootSound.stop();
    shootSound.play();

    muzzleFlash.visible = true;
    setTimeout(() => muzzleFlash.visible = false, 50);

    raycaster.setFromCamera({ x: 0, y: 0 }, camera);

    const tracerMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const tracerPoints = [];
    tracerPoints.push(gunBarrel.getWorldPosition(new THREE.Vector3()));
    tracerPoints.push(raycaster.ray.direction.clone().multiplyScalar(300).add(camera.position));
    const tracerGeometry = new THREE.BufferGeometry().setFromPoints(tracerPoints);
    const tracer = new THREE.Line(tracerGeometry, tracerMaterial);
    scene.add(tracer);
    bulletTracers.push(tracer);

    const intersects = raycaster.intersectObjects(enemies);
    if (intersects.length > 0) {
        const enemy = intersects[0].object;
        enemy.health -= 25;
        if (hitSound.isPlaying) hitSound.stop();
        hitSound.play();

        const originalColor = enemy.material.color.clone();
        enemy.material.color.set(0xffffff);
        setTimeout(() => enemy.material.color.copy(originalColor), 100);

        if (enemy.health <= 0) {
            scene.remove(enemy);
            enemies.splice(enemies.indexOf(enemy), 1);
        }
    }
}

// Lights
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

// Movement variables
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const moveSpeed = 50;

// Animation loop
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (controls.isLocked) {
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * moveSpeed * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * moveSpeed * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
    }

    // Enemy AI
    enemies.forEach(enemy => {
        enemy.lookAt(camera.position);
        enemy.translateZ(2 * delta);
    });

    // Bullet Tracers
    bulletTracers.forEach((tracer, index) => {
        if (tracer.material.opacity <= 0) {
            scene.remove(tracer);
            bulletTracers.splice(index, 1);
        } else {
            tracer.material.opacity -= 0.02;
        }
    });

    composer.render();
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

animate();
