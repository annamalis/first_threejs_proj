import * as THREE from 'three';
import { scene, camera, renderer } from './sceneSetup.js';
import { addEnvironment } from './environment.js';
import { loadModel } from './modelLoader.js';
import { trackKeys, moveCamera } from './playerMovement.js';
import { collisionManager } from './collisionManager.js';
import { pickUpItem, giveItemToTorus } from './itemInteraction.js';
import { keys } from './playerMovement.js';
import { showPrompt, hidePrompt } from './inventoryHUD.js';
import { playerInventory } from './inventoryManager.js';

// Setup scene and environment
addEnvironment();

// Track keys for movement
trackKeys();

let redBall = null;
let torus = null;

// Load models and add them to the collision manager
loadModel('./public/Char/test2.glb', 1).then(({ model, boundingBox }) => {
    torus = model; // Assign the torus model
    scene.add(model);

    // Position the torus
    torus.position.set(0, 0, 0);

    // Update its bounding box
    boundingBox.setFromObject(torus);
    collisionManager.addModel(torus, boundingBox);

    console.log('Torus Position:', torus.position);
});

loadModel('./public/Char/redball.glb', 1).then(({ model, boundingBox }) => {
    redBall = model;


    // Access the actual mesh (child) within the model
    const mesh = redBall.getObjectByProperty('type', 'Mesh'); // Get the Mesh object

    if (mesh) {
        // Calculate the world position of the mesh
        const worldPosition = new THREE.Vector3();
        mesh.getWorldPosition(worldPosition);

        // Update the redBall position to match its visual position
        redBall.position.set(-3, 0, 0);

        // Update the bounding box to reflect the red ball's current position
        boundingBox.setFromObject(redBall); // Use the entire model, not just the mesh

        
    }

    // Add to the scene and collision manager
    scene.add(redBall);
    collisionManager.addModel(redBall, boundingBox);
});

// Updated checkCollision function
const checkCollision = (newPosition) => {
    return collisionManager.checkCollision(newPosition);
};

// Animation loop
const animate = () => {
    requestAnimationFrame(animate);

    let promptShown = false; // Track whether a prompt is shown

    // Check proximity to redBall
    if (redBall) {
        const distance = camera.position.distanceTo(redBall.position);
        console.log('Distance to RedBall:', distance);

        if (distance < 1) {
            showPrompt('Pick Up - Press F');
            promptShown = true; // A prompt is being displayed

            if (keys['f']) {
                console.log("'F' key pressed, picking up RedBall");
                pickUpItem('Red Ball', redBall);
                redBall = null; // Remove reference after picking it up
                hidePrompt(); // Hide the prompt
            }
        }
    }

    // Proximity check for torus
    if (torus && !promptShown) { // Only check torus if no other prompt is active
        const torusDistance = camera.position.distanceTo(torus.position);
        if (torusDistance < 2 && playerInventory.items.includes('Red Ball')) {
            showPrompt('Give item - Press F');
            promptShown = true; // A prompt is being displayed

            if (keys['f']) {
                console.log("'F' key pressed, giving RedBall to Torus");
                giveItemToTorus('Red Ball');
                hidePrompt(); // Hide the prompt
            }
        }
    }

    // Hide the prompt if no prompt is active
    if (!promptShown) {
        hidePrompt();
    }

    // Handle camera movement
    moveCamera(checkCollision);

    // Render the scene
    renderer.render(scene, camera);
};
animate();