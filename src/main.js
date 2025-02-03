import * as THREE from 'three';
import { scene, camera, renderer, composer } from './sceneSetup.js';
import { addEnvironment, exteriorDoor, interiorDoor, setInteriorDoor } from './environment.js';
import { loadModel, loadModelWithAnimations } from './modelLoader.js';
import { trackKeys, moveCamera } from './playerMovement.js';
import { collisionManager } from './collisionManager.js';
import { keys } from './playerMovement.js';
import { showPrompt, hidePrompt } from './inventoryHUD.js';
import { playerInventory } from './inventoryManager.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';


// Variables
const mixers = []; // Array to store all animation mixers
let insideHouse = false;
let interiorEnvironment = null; // Track the interior scene
const gltfLoader = new GLTFLoader();

// Setup scene and environment
addEnvironment();

// Track keys for movement
trackKeys();


// Function to load the house interior
const loadInterior = () => {
    console.log("Transitioning to house interior...");

    // Remove only the exterior objects, keeping camera & lights
    scene.children
        .filter(obj => obj !== camera && obj !== composer && obj !== renderer)
        .forEach(obj => scene.remove(obj));

    gltfLoader.load(
        "./public/Char/house-interior.glb",
        (gltf) => {
            interiorEnvironment = gltf.scene; // ✅ Track the loaded interior
            interiorEnvironment.scale.set(1, 1, 1);
            interiorEnvironment.position.set(0, -1, 0);
            scene.add(interiorEnvironment);

            interiorEnvironment.traverse((child) => {
                if (child.isMesh) {
                    child.visible = true;
                }

                // ✅ Use the setter function to update `interiorDoor`
                if (child.name.toLowerCase() === "interior-door") {
                    setInteriorDoor(child); // ✅ Correct way to update
                    child.updateMatrixWorld(true);
                    console.log("✅ Interior door world position:", child.getWorldPosition(new THREE.Vector3()));
                }
            });

            // ✅ Move the camera inside the house
            camera.position.set(35, 1.5, 0);

            // ✅ Add Ambient Light
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);

            // ✅ Add Directional Light
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(10, 10, 10);
            directionalLight.castShadow = true;
            scene.add(directionalLight);

            console.log("House interior loaded at:", interiorEnvironment.position);
            console.log("Camera moved inside house:", camera.position);
        },
        undefined,
        (error) => {
            console.error("Error loading interior:", error);
        }
    );

    insideHouse = true;
};

//Function to load exterior
const loadExterior = () => {
    console.log("Transitioning to house exterior...");

    // ✅ Prevents interactions for a short time
    insideHouse = null;

    // ✅ Remove interior objects
    if (interiorEnvironment) {
        console.log("✅ Removing interior environment:", interiorEnvironment);
        interiorEnvironment.traverse((child) => {
            scene.remove(child);
        });
        scene.remove(interiorEnvironment);
        interiorEnvironment = null;
    } else {
        console.warn("⚠️ No interior environment found to remove.");
    }

    // ✅ Remove any lingering objects except camera & lights
    scene.children
        .filter(obj => obj !== camera && obj !== composer && obj !== renderer)
        .forEach(obj => scene.remove(obj));

    // ✅ Reload the exterior environment
    addEnvironment();

    // ✅ Debugging Camera Movement
    console.log("Before exiting, camera position:", camera.position);
    camera.position.set(28, 1.5, 0);
    camera.updateMatrixWorld(true);
    console.log("After exiting, camera position:", camera.position);

    // ✅ Set insideHouse = false **AFTER A SHORT DELAY**
    setTimeout(() => {
        insideHouse = false; // ✅ Now interactions are re-enabled
        console.log("✅ Re-enabling door interactions.");
    }, 500); // Delay re-enabling interactions for 500ms
};

// Check proximity to the exterior OR interior door
const checkDoorInteraction = () => {
    if (insideHouse === null) return; // ✅ Prevents immediate re-entry

    if (!insideHouse && exteriorDoor) { // Handle entering the house
        const doorWorldPosition = new THREE.Vector3();
        exteriorDoor.getWorldPosition(doorWorldPosition);
        const distance = camera.position.distanceTo(doorWorldPosition);

        if (distance < 2) {
            showPrompt("Press SPACE to Enter");
            if (keys[" "]) {
                hidePrompt();
                loadInterior();
                return; // ✅ Stops further execution in this frame
            }
        } else {
            hidePrompt();
        }
    }

    if (insideHouse && interiorDoor) { // Handle exiting the house
        const doorWorldPosition = new THREE.Vector3();
        interiorDoor.getWorldPosition(doorWorldPosition);
        const distance = camera.position.distanceTo(doorWorldPosition);

        if (distance < 2) {
            showPrompt("Press SPACE to Exit");
            if (keys[" "]) {
                hidePrompt();
                loadExterior();
                return; // ✅ Stops further execution in this frame
            }
        } else {
            hidePrompt();
        }
    }
};

// Updated checkCollision function
const checkCollision = (newPosition) => {
    return collisionManager.checkCollision(newPosition);
};

// Animation Loop
const clock = new THREE.Clock();
const animate = () => {
    requestAnimationFrame(animate);

    // Handle camera movement
    moveCamera(checkCollision);

    const delta = clock.getDelta(); // Time since last frame

    // Update all mixers
    mixers.forEach((mixer) => mixer.update(delta));

    // ✅ Ensure door interaction check happens continuously
    checkDoorInteraction();

    // Render using the composer
    composer.render(delta);

    
};
animate();