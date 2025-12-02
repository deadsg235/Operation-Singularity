import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.Fog(0x000000, 1, 150);

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
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

// Post-processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0;
bloomPass.strength = 2.5;
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
        case 'ShiftLeft':
            isSprinting = true;
            break;
        case 'Enter':
            togglePause();
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
        case 'ShiftLeft':
            isSprinting = false;
            break;
    }
};

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

renderer.domElement.addEventListener('click', () => {
    if (controls.isLocked && !isPaused) {
        shoot();
    } else if (!controls.isLocked && !isPaused) {
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
            color: new THREE.Color(0x111111 + Math.random() * 0x111111),
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

        // Buildings cast and receive shadows
        building.castShadow = true;
        building.receiveShadow = true;

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
    createStreetObjects();
}

function createStreetObjects() {
    const streetObjectMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.6 });

    for (let i = 0; i < 100; i++) {
        const type = Math.random();
        let geometry;
        if (type < 0.5) {
            geometry = new THREE.BoxGeometry(Math.random() * 2 + 0.5, Math.random() * 3 + 1, Math.random() * 2 + 0.5);
        } else {
            geometry = new THREE.CylinderGeometry(Math.random() * 0.5 + 0.2, Math.random() * 0.5 + 0.2, Math.random() * 3 + 1, 8);
        }

        const streetObject = new THREE.Mesh(geometry, streetObjectMaterial);

        streetObject.position.x = Math.random() * 400 - 200;
        streetObject.position.z = Math.random() * 400 - 200;
        streetObject.position.y = streetObject.geometry.parameters.height / 2;

        streetObject.castShadow = true;
        streetObject.receiveShadow = true;

        scene.add(streetObject);
    }
}
createCity();

// Gun
const gun = new THREE.Group();
const gunMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.5 });

const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.8), gunMaterial);
gunBody.position.set(0.5, -0.3, -1);
gun.add(gunBody);

const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 32), gunMaterial);
gunBarrel.position.set(0.5, -0.3, -1.8);
gun.add(gunBarrel);

const gunCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.4, 6), gunMaterial);
gunCylinder.rotation.z = Math.PI / 2;
gunCylinder.position.set(0.5, -0.3, -1.2);
gun.add(gunCylinder);

const gunGrip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.3), gunMaterial);
gunGrip.position.set(0.5, -0.6, -0.7);
gun.add(gunGrip);

const gunTrigger = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.2), gunMaterial);
gunTrigger.position.set(0.5, -0.45, -0.9);
gun.add(gunTrigger);

const gunHammer = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.1), gunMaterial);
gunHammer.position.set(0.5, -0.1, -0.7);
gun.add(gunHammer);

const gunFrontSight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.05), gunMaterial);
gunFrontSight.position.set(0.5, -0.2, -1.9);
gun.add(gunFrontSight);

const gunRearSight = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 0.05), gunMaterial);
gunRearSight.position.set(0.5, -0.2, -1.0);
gun.add(gunRearSight);

const gunTrigger = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.2), gunMaterial);
gunTrigger.position.set(0.5, -0.45, -0.9);
gun.add(gunTrigger);

const gunHammer = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.1), gunMaterial);
gunHammer.position.set(0.5, -0.1, -0.7);
gun.add(gunHammer);

const gunFrontSight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.05), gunMaterial);
gunFrontSight.position.set(0.5, -0.2, -1.9);
gun.add(gunFrontSight);

const gunRearSight = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 0.05), gunMaterial);
gunRearSight.position.set(0.5, -0.2, -1.0);
gun.add(gunRearSight);

const initialGunPosition = gun.position.clone();
const initialGunRotation = gun.rotation.clone();

camera.add(gun);
scene.add(camera);

// Muzzle Flash
const muzzleFlash = new THREE.PointLight(0xffffff, 100, 20);
muzzleFlash.position.set(0.5, -0.2, -1.75);
muzzleFlash.visible = false;
gun.add(muzzleFlash);

// Enemies
const enemies = [];
const enemyMeshes = [];
function createEnemy() {
    const enemy = new THREE.Group();

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 1));
    torso.position.y = 1.5;
    enemy.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
    head.position.y = 3.5;
    enemy.add(head);

    // Left Arm
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 0.5));
    leftArm.position.set(-1.25, 2.5, 0);
    enemy.add(leftArm);

    // Right Arm
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 0.5));
    rightArm.position.set(1.25, 2.5, 0);
    enemy.add(rightArm);

    // Left Leg
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 0.5));
    leftLeg.position.set(-0.75, -0.5, 0);
    enemy.add(leftLeg);

    // Right Leg
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 0.5));
    rightLeg.position.set(0.75, -0.5, 0);
    enemy.add(rightLeg);

    return enemy;
}

function spawnEnemies() {
    for (let i = 0; i < 10; i++) {
        const enemy = createEnemy();
        const enemyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.8, roughness: 0.2, emissive: 0xff0000, emissiveIntensity: 0.5 });
        
        enemy.traverse((child) => {
            if (child.isMesh) {
                child.material = enemyMaterial;
                enemyMeshes.push(child);
            }
        });

        enemy.position.x = Math.random() * 300 - 150;
        enemy.position.z = Math.random() * 300 - 150;
        enemy.position.y = 3; // Adjust for new height

        enemy.health = 100;
        enemy.lastShotTime = 0;
        enemy.fireRate = 0.8; // seconds
        enemy.state = ENEMY_STATE_CHASE; // Initial state
        enemy.flankTargetPosition = new THREE.Vector3(); // For flanking behavior

        scene.add(enemy);
        enemies.push(enemy);
    }
}
spawnEnemies();

const ENEMY_STATE_CHASE = 0;
const ENEMY_STATE_FLANK = 1;

let isPaused = false;
const pauseMenu = document.getElementById('pause-menu');

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        pauseMenu.style.display = 'flex';
        controls.unlock();
    } else {
        pauseMenu.style.display = 'none';
        controls.lock();
    }
}

function enemyAI(enemy, delta) {
    const playerPosition = controls.getObject().position;
    const distanceToPlayer = enemy.position.distanceTo(playerPosition);
    const enemyMoveSpeed = 7 * delta;

    switch (enemy.state) {
        case ENEMY_STATE_CHASE:
            enemy.lookAt(playerPosition);
            enemy.translateZ(enemyMoveSpeed);

            if (distanceToPlayer < 40 && Math.random() < 0.01) { // 1% chance to flank if close
                enemy.state = ENEMY_STATE_FLANK;
                // Calculate a flanking position
                const playerDirection = new THREE.Vector3();
                playerDirection.subVectors(playerPosition, enemy.position).normalize();
                const sideDirection = new THREE.Vector3().crossVectors(camera.up, playerDirection).normalize();
                
                // Randomly choose left or right flank
                if (Math.random() > 0.5) {
                    sideDirection.negate(); 
                }
                enemy.flankTargetPosition.copy(playerPosition).add(sideDirection.multiplyScalar(Math.random() * 20 + 10)); // 10-30 units to the side
            }
            break;

        case ENEMY_STATE_FLANK:
            const distanceToFlankTarget = enemy.position.distanceTo(enemy.flankTargetPosition);
            if (distanceToFlankTarget > 5) { // If not at flank target, move towards it
                enemy.lookAt(enemy.flankTargetPosition);
                enemy.translateZ(enemyMoveSpeed);
            } else { // Once at flank target, resume chasing
                enemy.state = ENEMY_STATE_CHASE;
            }

            // Still try to look at player while flanking
            enemy.lookAt(playerPosition);
            break;
    }
}

// Shooting
const raycaster = new THREE.Raycaster();
const bulletTracers = [];
function shoot() {
    if (shootSound.isPlaying) shootSound.stop();
    shootSound.play();

    muzzleFlash.visible = true;
    setTimeout(() => muzzleFlash.visible = false, 50);

    // Recoil animation
    gun.position.set(initialGunPosition.x, initialGunPosition.y + 0.1, initialGunPosition.z + 0.2);
    gun.rotation.set(initialGunRotation.x + 0.1, initialGunRotation.y, initialGunRotation.z);

    setTimeout(() => {
        gun.position.copy(initialGunPosition);
        gun.rotation.copy(initialGunRotation);
    }, 100);

    raycaster.setFromCamera({ x: 0, y: 0 }, camera);

    const tracerMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const tracerPoints = [];
    tracerPoints.push(gunBarrel.getWorldPosition(new THREE.Vector3()));
    tracerPoints.push(raycaster.ray.direction.clone().multiplyScalar(300).add(camera.position));
    const tracerGeometry = new THREE.BufferGeometry().setFromPoints(tracerPoints);
    const tracer = new THREE.Line(tracerGeometry, tracerMaterial);
    scene.add(tracer);
    bulletTracers.push(tracer);

    const intersects = raycaster.intersectObjects(enemyMeshes);
    if (intersects.length > 0) {
        const mesh = intersects[0].object;
        const enemy = mesh.parent;

        enemy.health -= 25;
        if (hitSound.isPlaying) hitSound.stop();
        hitSound.play();

        const originalColor = mesh.material.color.clone();
        mesh.material.color.set(0xffffff);
        setTimeout(() => mesh.material.color.copy(originalColor), 100);

        if (enemy.health <= 0) {
            scene.remove(enemy);
            enemies.splice(enemies.indexOf(enemy), 1);

            enemy.traverse((child) => {
                if (child.isMesh) {
                    const index = enemyMeshes.indexOf(child);
                    if (index > -1) {
                        enemyMeshes.splice(index, 1);
                    }
                }
            });
        }
    }
}

// Lights
const ambientLight = new THREE.AmbientLight(0x404040, 15);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 100, 100, 2);
pointLight.position.set(0, 0, 0);
camera.add(pointLight);

const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x333333, 5);
scene.add(hemisphereLight);

const bluePointLight = new THREE.PointLight(0x0000ff, 2, 200, 1);
bluePointLight.position.set(0, 50, 0);
scene.add(bluePointLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 5);
sunLight.position.set(50, 200, 100);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 500;
sunLight.shadow.camera.left = -250;
sunLight.shadow.camera.right = 250;
sunLight.shadow.camera.top = 250;
sunLight.shadow.camera.bottom = -250;
scene.add(sunLight);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Player Health
let playerMaxHealth = 100;
let playerCurrentHealth = playerMaxHealth;
const healthBar = document.getElementById('health-bar');

function updateHealthBar() {
    healthBar.style.width = `${(playerCurrentHealth / playerMaxHealth) * 100}%`;
}

function takeDamage(amount) {
    playerCurrentHealth -= amount;
    if (playerCurrentHealth < 0) {
        playerCurrentHealth = 0;
    }
    updateHealthBar();
    // Add game over logic here if health reaches 0
}

// Initialize health bar
updateHealthBar();

// Movement variables
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
const moveSpeed = 50;
let velocityY = 0;
const gravity = 0.5;

let isSprinting = false;
const walkSpeed = 80;
const sprintSpeed = 150;

// Animation loop
const clock = new THREE.Clock();
const collisionRaycaster = new THREE.Raycaster();
const collisionDistance = 5;
const cameraDirection = new THREE.Vector3();

const moveDirection = new THREE.Vector3();

function animate() {
    requestAnimationFrame(animate);

    if (isPaused) {
        return;
    }

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();


    bluePointLight.position.x = Math.sin(elapsedTime * 0.1) * 100;
    bluePointLight.position.z = Math.cos(elapsedTime * 0.1) * 100;

    sunLight.position.x = Math.sin(elapsedTime * 0.05) * 200;
    sunLight.position.y = Math.sin(elapsedTime * 0.05) * 100 + 100; // Oscillate between 0 and 200
    sunLight.position.z = Math.cos(elapsedTime * 0.05) * 200;

    if (controls.isLocked) {
        const cameraDirection = controls.getObject().getWorldDirection(new THREE.Vector3());
        const rightDirection = new THREE.Vector3().crossVectors(controls.getObject().up, cameraDirection).negate();

        let moveF = Number(moveForward) - Number(moveBackward);
        let moveR = Number(moveRight) - Number(moveLeft);

        const currentMoveSpeed = isSprinting ? sprintSpeed : walkSpeed;

        const intendedMoveVector = new THREE.Vector3();

        if (moveF !== 0) {
            intendedMoveVector.add(cameraDirection.clone().multiplyScalar(moveF));
        }
        if (moveR !== 0) {
            intendedMoveVector.add(rightDirection.clone().multiplyScalar(moveR));
        }

        if (intendedMoveVector.length() > 0) {
            intendedMoveVector.normalize().multiplyScalar(currentMoveSpeed * delta);

            const raycasterOrigin = controls.getObject().position.clone();
            const raycasterDirection = intendedMoveVector.clone().normalize();
            const raycasterDistance = intendedMoveVector.length() + 0.1; // Add a small buffer

            const collisionRaycaster = new THREE.Raycaster(raycasterOrigin, raycasterDirection);
            const intersects = collisionRaycaster.intersectObjects(buildings);

            if (intersects.length === 0 || intersects[0].distance > raycasterDistance) {
                controls.getObject().position.add(intendedMoveVector);
            }
        }

        velocityY -= gravity * delta;
        controls.getObject().position.y += velocityY;

        if (controls.getObject().position.y < 10) {
            velocityY = 0;
            controls.getObject().position.y = 10;
        }
    }

    // Enemy AI
    enemies.forEach(enemy => {
        enemyAI(enemy, delta);

        // Enemy firing logic
        const playerPosition = controls.getObject().position;
        const distanceToPlayer = enemy.position.distanceTo(playerPosition);
        const attackRange = 50;
        const enemyBulletSpeed = 200;

        if (distanceToPlayer < attackRange && elapsedTime - enemy.lastShotTime > enemy.fireRate) {
            const enemyRaycaster = new THREE.Raycaster();
            const enemyDirection = new THREE.Vector3();
            enemyDirection.subVectors(playerPosition, enemy.position).normalize();

            // Add some inaccuracy
            enemyDirection.x += (Math.random() - 0.5) * 0.2;
            enemyDirection.y += (Math.random() - 0.5) * 0.2;
            enemyDirection.z += (Math.random() - 0.5) * 0.2;
            enemyDirection.normalize();

            enemyRaycaster.set(enemy.position, enemyDirection);

            const obstructionIntersects = enemyRaycaster.intersectObjects(buildings);
            const isObstructed = obstructionIntersects.length > 0 && obstructionIntersects[0].distance < distanceToPlayer;

            if (!isObstructed) {
                const tracerMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
                const tracerPoints = [];
                tracerPoints.push(enemy.position.clone());
                tracerPoints.push(enemyDirection.clone().multiplyScalar(attackRange).add(enemy.position));
                const tracerGeometry = new THREE.BufferGeometry().setFromPoints(tracerPoints);
                const tracer = new THREE.Line(tracerGeometry, tracerMaterial);
                scene.add(tracer);
                bulletTracers.push(tracer);

                takeDamage(10); // Player takes damage
            }
            enemy.lastShotTime = elapsedTime;
        }
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
