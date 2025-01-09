import * as THREE from 'three';

// Create a class to handle model collision logic
class CollisionManager {
    constructor() {
        this.models = []; // This will store the models and their bounding boxes
    }

    // Add a model to the collision manager
    addModel(model, boundingBox) {
        this.models.push({ model, boundingBox });
    }

    // Check collision with all models in the scene
    checkCollision(newPosition) {
        const cameraBox = new THREE.Box3().setFromCenterAndSize(newPosition, new THREE.Vector3(0.2, 0.2, 0.2));

        // Check for collisions with all models
        for (const { boundingBox } of this.models) {
            if (boundingBox && boundingBox.intersectsBox(cameraBox)) {
                return true;
            }
        }

        return false;
    }
}

export const collisionManager = new CollisionManager();