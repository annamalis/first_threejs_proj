import * as THREE from 'three';
import { scene, camera, renderer } from './sceneSetup.js';
import { addEnvironment } from './environment.js';
import { loadModel } from './modelLoader.js';
import { trackKeys, moveCamera } from './playerMovement.js';
import { collisionManager } from './collisionManager.js'; 

// Setup scene and environment
addEnvironment();

// Track keys for movement
trackKeys();

// Load models and add them to the collision manager
loadModel('./public/Char/test2.glb', 1).then(({ model, boundingBox }) => {
    scene.add(model); // Add model to the scene
    collisionManager.addModel(model, boundingBox); // Add the model's bounding box to collision manager
});

loadModel('./public/Char/redball.glb', 1).then(({ model, boundingBox }) => {
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
    moveCamera(checkCollision);
    renderer.render(scene, camera);
};
animate();