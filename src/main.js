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
const mixers = []; // Array to store all animation mixers

// Load the torus model with animations
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

    mixers.push(torusMixer); // Add the torus mixer to the mixers array
});

// Load the red ball model
loadModel('./public/Char/redball.glb', 1, { x: -3, y: 0, z: 0 }, true).then(({ model, boundingBox }) => {
    redBall = model;

    console.log('RedBall Loaded');
    console.log('Bounding Box:', boundingBox);
}).catch((error) => {
    console.error('Error loading red ball:', error);
});

// Load a new animated model (body-deform6.glb)
loadModelWithAnimations('./public/Char/body-deform6.glb', .5).then(({ model, mixer, animations }) => {
    scene.add(model);

    // Position the model in the scene
    model.position.set(2, 1.5, -3);

    // Play the first animation if available
    const animationClip = animations.find((clip) => clip.name === 'Key.001Action.002');
    if (animationClip) {
        const action = mixer.clipAction(animationClip);
        action.play();
    }

    mixers.push(mixer); // Add this mixer's animations to the array
}).catch((error) => {
    console.error('Error loading body-deform6.glb:', error);
});

// Load environment test model
loadModel('./public/Char/envr_test3.glb', 3).then(({ model, boundingBox }) => {
    model.position.y = -0.9;
    scene.add(model);

    console.log('Environment Test Model Loaded');
    console.log('Bounding Box:', boundingBox);
}).catch((error) => {
    console.error('Error loading the environment test model:', error);
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

    // Recalculate collision box when torus animates
    if (torus) {
        const torusBoundingBox = new THREE.Box3().setFromObject(torus);
        collisionManager.addModel(torus, torusBoundingBox);
    }

    // Handle camera movement
    moveCamera(checkCollision);

    const delta = clock.getDelta(); // Time since last frame

    // Update all mixers
    mixers.forEach((mixer) => mixer.update(delta));

    // Render the scene
    renderer.render(scene, camera);
};
animate();