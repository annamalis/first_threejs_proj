import * as THREE from 'three';
import { camera } from './sceneSetup.js';

export const keys = {};
export const moveSpeed = 0.1;
const rotationSpeed = 0.05;

export const trackKeys = () => {
    document.addEventListener('keydown', (event) => {
        keys[event.key] = true;
    });
    document.addEventListener('keyup', (event) => {
        keys[event.key] = false;
    });
};

export const moveCamera = (collisionCallback) => {
    if (window.comboLockActive) {
        return;
      }

    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    const moveVector = new THREE.Vector3();

    if (keys['w'] || keys['ArrowUp']) moveVector.add(direction.multiplyScalar(moveSpeed));
    if (keys['s'] || keys['ArrowDown']) moveVector.add(direction.multiplyScalar(-moveSpeed));

    const right = new THREE.Vector3();
    right.crossVectors(camera.up, direction).normalize();
    if (keys['a'] || keys['ArrowLeft']) moveVector.add(right.multiplyScalar(moveSpeed));
    if (keys['d'] || keys['ArrowRight']) moveVector.add(right.multiplyScalar(-moveSpeed));

    const newPosition = camera.position.clone().add(moveVector);

    if (!collisionCallback(newPosition)) {
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