import * as THREE from 'three';
import { scene, camera, renderer, composer } from './sceneSetup.js';
import { addEnvironment } from './environment.js';
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

    // Render the scene
    // Render using the composer
    composer.render(delta);
};
animate();