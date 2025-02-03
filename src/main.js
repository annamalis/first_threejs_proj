import * as THREE from 'three';
import { scene, camera, renderer, composer } from './sceneSetup.js';
import { addEnvironment, exteriorDoor } from './environment.js';
import { loadModel, loadModelWithAnimations } from './modelLoader.js';
import { trackKeys, moveCamera } from './playerMovement.js';
import { collisionManager } from './collisionManager.js';
import { keys } from './playerMovement.js';
import { showPrompt, hidePrompt } from './inventoryHUD.js';
import { playerInventory } from './inventoryManager.js';

// Setup scene and environment
addEnvironment();

// Track keys for movement
trackKeys();

const mixers = []; // Array to store all animation mixers
let insideHouse = false;

//debugging outdoor/indoor transition
console.log("Checking door interaction. Door exists:", exteriorDoor !== null);

// Function to load the house interior
const loadInterior = () => {
    // Clear existing scene objects (removes the exterior)
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }

    // Load the house interior
    const gltfLoader = new THREE.GLTFLoader();
    gltfLoader.load(
        "./public/Char/house-interior.glb",
        (gltf) => {
            const interior = gltf.scene;
            interior.scale.set(1, 1, 1);
            interior.position.set(0, -1, 0);
            scene.add(interior);

            // Set up collisions for interior walls
            interior.traverse((child) => {
                if (child.isMesh && child.name.toLowerCase().includes("wall")) {
                    const boundingBox = new THREE.Box3().setFromObject(child);
                    collisionManager.addModel(child, boundingBox);
                }
            });

            console.log("House interior loaded.");
        },
        undefined,
        (error) => {
            console.error("Error loading interior:", error);
        }
    );

    insideHouse = true; // Update state
};

// Check proximity to the exterior door
const checkDoorInteraction = () => {

    const doorWorldPosition = new THREE.Vector3();
exteriorDoor.getWorldPosition(doorWorldPosition);
console.log("Distance to door:", camera.position.distanceTo(doorWorldPosition));


    // ✅ Wait until the door is set before running logic
    if (insideHouse || !exteriorDoor) {
        return; // Don't run if inside house or door isn't loaded yet
    }

    const distance = camera.position.distanceTo(exteriorDoor.position);
    
    if (distance < 2) { // If player is near the door
        showPrompt("Press SPACE to Enter");

        if (keys[" "]) { // Spacebar pressed
            hidePrompt();
            loadInterior(); // Transition to the interior
        }
    } else {
        hidePrompt(); // Hide prompt when not near
    }

    console.log("Player position:", camera.position);
console.log("Door position:", exteriorDoor.position);
console.log("Distance to door:", camera.position.distanceTo(exteriorDoor.position));
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
    if (exteriorDoor) {
        checkDoorInteraction();
    }

    // Render using the composer
    composer.render(delta);

    
};
animate();