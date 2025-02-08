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

    updateModel(model, newBoundingBox) {
        for (let item of this.models) {
           if (item.model === model) {
              item.boundingBox = newBoundingBox;
              break;
           }
        }
     }

     updateCollisionBoxes(object) {
        object.traverse((child) => {
          if (child.isMesh && child.name.startsWith("collision_")) {
            // Recompute the bounding box based on the current world matrix.
            child.geometry.computeBoundingBox();
            // Optionally, you can update the stored bounding box in your collision manager.
            // For example:
            const updatedBox = new THREE.Box3().setFromObject(child);
            collisionManager.updateModel(child, updatedBox); // You'll need to implement updateModel
          }
        });
      }
}

export const collisionManager = new CollisionManager();