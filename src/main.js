import * as THREE from 'three';
import { scene, camera, renderer } from './sceneSetup.js';
import { addEnvironment } from './environment.js';
import { loadModel } from './modelLoader.js';
import { trackKeys, moveCamera } from './playerMovement.js';
import { collisionManager } from './collisionManager.js'; 
import { pickUpItem } from './itemInteraction.js';
import { keys } from './playerMovement.js';

// Setup scene and environment
addEnvironment();

// Track keys for movement
trackKeys();

// Declare redBall variable
let redBall = null;

// Load models and add them to the collision manager
loadModel('./public/Char/test2.glb', 1).then(({ model, boundingBox }) => {
    scene.add(model); // Add model to the scene
    collisionManager.addModel(model, boundingBox); // Add the model's bounding box to collision manager
});

loadModel('./public/Char/redball.glb', 1).then(({ model, boundingBox }) => {
    redBall = model; // Assign redBall when the model loads
    scene.add(model); // Add model to the scene
    collisionManager.addModel(model, boundingBox); // Add the model's bounding box to collision manager
});

// Updated checkCollision function
const checkCollision = (newPosition) => {
    return collisionManager.checkCollision(newPosition);
};

// Animation loop
const animate = () => {
    requestAnimationFrame(animate);

    // Check if we're close enough to redBall
    if (redBall) {

        const distance = camera.position.distanceTo(redBall.position);

        if (distance < 3) {
            if (keys['f']) {
                console.log("'F' key pressed, picking up RedBall");
                pickUpItem('Red Ball', redBall);
                redBall = null; // Remove reference after picking it up
            }
        }
    }

    // Handle camera movement
    moveCamera(checkCollision);

    // Render the scene
    renderer.render(scene, camera);
};
animate(); // Correctly invoke the animate function