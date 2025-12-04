import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// Get the canvas element
const canvas = document.getElementById('gameCanvas');
const blocker = document.createElement('div');
blocker.style.position = 'absolute';
blocker.style.width = '100%';
blocker.style.height = '100%';
blocker.style.background = 'rgba(0,0,0,0.5)';
blocker.style.display = 'flex';
blocker.style.justifyContent = 'center';
blocker.style.alignItems = 'center';
blocker.style.color = 'white';
blocker.style.fontSize = '30px';
blocker.innerHTML = 'Click to play';
document.body.appendChild(blocker);


// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Light blue sky

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 0); // Player height

// Renderer setup
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x222222); // Dark background
renderer.shadowMap.enabled = true; // Enable shadows

// Add a simple floor
const floorGeometry = new THREE.PlaneGeometry(100, 100, 1, 1);
const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x808080, side: THREE.DoubleSide });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true; // Floor can receive shadows
scene.add(floor);

// Add some basic lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true; // Light can cast shadows
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
scene.add(directionalLight);

// Player controls
let controls;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();

let prevTime = performance.now();

// PointerLockControls setup
controls = new PointerLockControls(camera, document.body);

const instructions = document.createElement('div');
instructions.style.position = 'absolute';
instructions.style.width = '100%';
instructions.style.height = '100%';
instructions.style.display = 'flex';
instructions.style.justifyContent = 'center';
instructions.style.alignItems = 'center';
instructions.style.color = 'white';
instructions.style.fontSize = '30px';
instructions.innerHTML = 'Click to Play<br>(W, A, S, D = Move, Mouse = Look)';
document.body.appendChild(instructions);

instructions.addEventListener('click', () => {
    controls.lock();
});


controls.addEventListener('lock', function () {
    instructions.style.display = 'none';
    blocker.style.display = 'none';
});

controls.addEventListener('unlock', function () {
    instructions.style.display = 'flex';
    blocker.style.display = 'flex';
});

scene.add(controls.getObject());

// Keyboard event listeners
const onKeyDown = function (event) {
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

const onKeyUp = function (event) {
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

// --- Enemy Logic ---
const enemies = [];
const enemySpeed = 1.5; // units per second

// Function to create a primitive humanoid enemy
function createHumanoidEnemy() {
    const enemyGroup = new THREE.Group();
    const enemyMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 }); // Red color

    // Body (Capsule)
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1.0, 4, 8);
    const body = new THREE.Mesh(bodyGeometry, enemyMaterial);
    body.position.y = 0.5; // Half of height + head radius
    body.castShadow = true;
    enemyGroup.add(body);

    // Head (Sphere)
    const headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
    const head = new THREE.Mesh(headGeometry, enemyMaterial);
    head.position.y = 1.35; // On top of the body
    head.castShadow = true;
    enemyGroup.add(head);

    // Arms (Capsules) - simple
    const armGeometry = new THREE.CapsuleGeometry(0.1, 0.7, 4, 8);
    const leftArm = new THREE.Mesh(armGeometry, enemyMaterial);
    leftArm.position.set(-0.4, 0.7, 0);
    leftArm.rotation.z = Math.PI / 4;
    leftArm.castShadow = true;
    enemyGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, enemyMaterial);
    rightArm.position.set(0.4, 0.7, 0);
    rightArm.rotation.z = -Math.PI / 4;
    rightArm.castShadow = true;
    enemyGroup.add(rightArm);

    // Legs (Capsules) - simple
    const legGeometry = new THREE.CapsuleGeometry(0.12, 0.8, 4, 8);
    const leftLeg = new THREE.Mesh(legGeometry, enemyMaterial);
    leftLeg.position.set(-0.15, -0.2, 0);
    leftLeg.castShadow = true;
    enemyGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, enemyMaterial);
    rightLeg.position.set(0.15, -0.2, 0);
    rightLeg.castShadow = true;
    enemyGroup.add(rightLeg);

    // Adjust the whole group's pivot to its base for easier positioning on floor
    enemyGroup.position.y = 0.8; // Adjust to stand on the floor (body.y + body.height/2 + head.radius approx)

    return enemyGroup;
}

// Instantiate an enemy
const enemy = createHumanoidEnemy();
enemy.position.set(5, 0, -5); // Initial position for the enemy
scene.add(enemy);
enemies.push(enemy);

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    if (controls.isLocked === true) {
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); // this ensures consistent movements in all directions

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        // --- Enemy Movement Update ---
        enemies.forEach(currentEnemy => {
            const playerPosition = controls.getObject().position;
            const enemyPosition = currentEnemy.position;

            // --- Rudimentary Flanking Logic ---
            // Aim for a slightly offset position from the player
            // Oscillates the target point around the player
            const flankingOffset = new THREE.Vector3(
                Math.sin(time * 0.0005) * 3, // Oscillate X offset with time
                0,
                Math.cos(time * 0.0005) * 3  // Oscillate Z offset with time
            );

            const targetPosition = playerPosition.clone().add(flankingOffset);

            const targetDirection = new THREE.Vector3().subVectors(targetPosition, enemyPosition);
            targetDirection.y = 0; // Keep movement on the horizontal plane
            targetDirection.normalize();

            // Move enemy towards target position
            currentEnemy.position.x += targetDirection.x * enemySpeed * delta;
            currentEnemy.position.z += targetDirection.z * enemySpeed * delta;

            // Make enemy look at player (still relevant for "awareness")
            currentEnemy.lookAt(playerPosition.x, currentEnemy.position.y, playerPosition.z);
        });
    }

    prevTime = time;

    renderer.render(scene, camera);
}

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();