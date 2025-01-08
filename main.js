import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Canvas
const canvas = document.querySelector('canvas.webgl')


// Scene
const scene = new THREE.Scene()


// Sky
const loader = new THREE.CubeTextureLoader();
const skyboxTexture = loader.load([

    'public/skybox_px.jpg', //left, correct
    'public/skybox_nx.jpg', //right, correct 
    'public/skybox_nz.jpg', //top, correct
    'public/skybox_pz.jpg', //bottom, correct
    'public/skybox_py.jpg',  //back, correct
    'public/skybox_ny.jpg' //front, correct

]);
scene.background = skyboxTexture;


// Ground Terrain
const groundGeometry = new THREE.PlaneGeometry(50, 50); // Large plane for terrain
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x556b2f }); // Grass-green
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotate to lie flat
ground.receiveShadow = true; // Enable shadow casting
ground.position.set(0, -1, 0); // Place ground slightly below the camera
scene.add(ground);


// Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);


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

    
    // Up/Down rotation for testing Cube Texture
    if (keys['z']) {
        camera.rotation.x += rotationSpeed;
    }
    if (keys['c']) {
        camera.rotation.x -= rotationSpeed;
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