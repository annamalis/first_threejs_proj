import * as THREE from 'three';
import { scene, camera, renderer } from './sceneSetup.js';
import { addEnvironment } from './environment.js';
import { loadModel, loadModelWithAnimations } from './modelLoader.js';
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
let torusMixer = null;
let idleAction = null;
let receiveBallAction = null;

// Load models and add them to the collision manager
loadModelWithAnimations('./public/Char/test3.glb', 1).then(({ model, mixer, animations }) => {
    torus = model;
    torusMixer = mixer;

    // Add the model to the scene
    scene.add(torus);

    // Position the torus
    torus.position.set(0, 0, 0);

    // Get the animations by name
    idleAction = torusMixer.clipAction(animations.find((clip) => clip.name === 'Idle Wobble'));
    receiveBallAction = torusMixer.clipAction(animations.find((clip) => clip.name === 'ReceiveItemFlip'));

    // Play the idle animation
    if (idleAction) idleAction.play();
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
const clock = new THREE.Clock();
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
                giveItemToTorus('Red Ball', idleAction, receiveBallAction, torusMixer);
                hidePrompt(); // Hide the prompt
            }
        }
    }

    // Hide the prompt if no prompt is active
    if (!promptShown) {
        hidePrompt();
    }
    if (torus) {
        const torusBoundingBox = new THREE.Box3().setFromObject(torus);
        collisionManager.addModel(torus, torusBoundingBox);
    }

    // Handle camera movement
    moveCamera(checkCollision);

    const delta = clock.getDelta(); // Time since last frame
    if (torusMixer) torusMixer.update(delta); // Update the animation mixer

    // Render the scene
    renderer.render(scene, camera);
};
animate();