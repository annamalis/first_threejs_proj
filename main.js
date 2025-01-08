import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Canvas
const canvas = document.querySelector('canvas.webgl')


// Scene
const scene = new THREE.Scene()

// Objects
const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshBasicMaterial({color: 0xff0000})
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

// Sizes
const sizes = {
    width: 800,
    height: 600
}

// Camera 
const camera = new THREE.PerspectiveCamera(75, sizes.width/sizes.height)
camera.position.z = 3
scene.add(camera)

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)

renderer.render(scene, camera)

// Movement Variables
const moveSpeed = 0.1;    // Speed of movement
const rotationSpeed = 0.05; // Speed of rotation
const keys = {};

// Track Key States
document.addEventListener('keydown', (event) => {
    keys[event.key] = true;
});
document.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

// Calculate Movement
const moveCamera = () => {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    // Forward and Backward (W/S or Arrow Up/Down)
    if (keys['ArrowUp'] || keys['w']) {
        camera.position.add(direction.multiplyScalar(moveSpeed));
    }
    if (keys['ArrowDown'] || keys['s']) {
        camera.position.add(direction.multiplyScalar(-moveSpeed));
    }

    // Left and Right (A/D or Arrow Left/Right)
    const right = new THREE.Vector3();
    right.crossVectors(camera.up, direction).normalize();
    if (keys['ArrowLeft'] || keys['a']) {
        camera.position.add(right.multiplyScalar(moveSpeed));
    }
    if (keys['ArrowRight'] || keys['d']) {
        camera.position.add(right.multiplyScalar(-moveSpeed));
    }

    // Rotation (Q/E for strafing the view)
    if (keys['q']) {
        camera.rotation.y += rotationSpeed;
    }
    if (keys['e']) {
        camera.rotation.y -= rotationSpeed;
    }
};

// Animation Loop
const animate = () => {
    requestAnimationFrame(animate);

    // Apply Movement
    moveCamera();

    renderer.render(scene, camera);
}
animate();