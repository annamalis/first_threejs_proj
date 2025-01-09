import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

// Canvas
const canvas = document.querySelector('canvas.webgl')


// Scene
const scene = new THREE.Scene()


// Sky
const loader = new THREE.CubeTextureLoader();
const skyboxTexture = loader.load([

    '/skybox_px.jpg', //left, correct
    '/skybox_nx.jpg', //right, correct 
    '/skybox_nz.jpg', //top, correct
    '/skybox_pz.jpg', //bottom, correct
    '/skybox_py.jpg',  //back, correct
    '/skybox_ny.jpg' //front, correct

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
/*
const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshBasicMaterial({color: 0xff0000})
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh) */ //turning off the red cube for a min


// Loading Model
/*
const loaderMod = new FBXLoader();
loaderMod.load(
    './public/Char/Ch48.fbx', 
    (fbx) => {
        fbx.scale.setScalar(0.1);
        scene.add(fbx);
    },
    undefined,
    (error) => {
        console.error('Error loading the FBX model:', error);
    }
); */ //using FBX
let modelBoundingBox = null;
const loaderMod = new GLTFLoader();
loaderMod.load(
    '/Char/test2.glb', // Or use '.glb' for binary format
    (gltf) => {
        const model = gltf.scene; // GLTF files have the scene property
        model.scale.set(1, 1, 1); // Adjust the scale as needed
        //model.position.set(0, 0, 0);
        scene.add(model); // Add the model to the scene

        // Create a bounding box for the model
        const box = new THREE.Box3().setFromObject(model);
        modelBoundingBox = box; // Store it for collision detection
    },
    undefined,
    (error) => {
        console.error('Error loading the GLTF model:', error);
    }
);


// Collision Detection Function
const checkCollision = () => {
    if (!modelBoundingBox) return false; // No collision if bounding box is not set

    // Create a small bounding box around the camera
    const cameraBox = new THREE.Box3().setFromCenterAndSize(
        camera.position,
        new THREE.Vector3(0.2, 0.2, 0.2) // Adjust size as needed
    );

    // Check if the camera's bounding box intersects the model's bounding box
    return modelBoundingBox.intersectsBox(cameraBox);
};



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


const moveCamera = () => {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    const moveVector = new THREE.Vector3(); // Store movement in this vector

    // Forward and Backward (W/S or Arrow Up/Down)
    if (keys['ArrowUp'] || keys['w']) {
        moveVector.add(direction.multiplyScalar(moveSpeed));
    }
    if (keys['ArrowDown'] || keys['s']) {
        moveVector.add(direction.multiplyScalar(-moveSpeed));
    }

    // Left and Right (A/D or Arrow Left/Right)
    const right = new THREE.Vector3();
    right.crossVectors(camera.up, direction).normalize();
    if (keys['ArrowLeft'] || keys['a']) {
        moveVector.add(right.multiplyScalar(moveSpeed));
    }
    if (keys['ArrowRight'] || keys['d']) {
        moveVector.add(right.multiplyScalar(-moveSpeed));
    }

    // Apply movement and check collision
    const newPosition = camera.position.clone().add(moveVector);
    const tempCameraBox = new THREE.Box3().setFromCenterAndSize(
        newPosition,
        new THREE.Vector3(0.2, 0.2, 0.2) // Adjust size as needed
    );

    if (modelBoundingBox && modelBoundingBox.intersectsBox(tempCameraBox)) {
        // Collision detected, don't apply the movement
        console.log("Collision detected!");
    } else {
        // No collision, apply the movement
        camera.position.copy(newPosition);
    }

    // Camera rotation (Q/E)
    if (keys['q']) {
        camera.rotation.y += rotationSpeed; // Rotate counterclockwise
    }
    if (keys['e']) {
        camera.rotation.y -= rotationSpeed; // Rotate clockwise
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