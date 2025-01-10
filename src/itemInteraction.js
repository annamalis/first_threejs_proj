import * as THREE from 'three';
import { playerInventory } from './inventoryManager.js';
import { updateHUD } from './inventoryHUD.js';
import { scene } from './sceneSetup.js';

export function pickUpItem(itemName, object3D) {
    // Remove from scene
    scene.remove(object3D);

    // Add to inventory
    playerInventory.addItem(itemName);

    // Update the UI
    updateHUD();
}

export function giveItemToTorus(itemName, idleAction, receiveBallAction, mixer) {
    // Check if the item exists in the inventory
    if (playerInventory.items.includes(itemName)) {
        // Remove the item from the inventory
        playerInventory.removeItem(itemName);
        console.log(`${itemName} given to the torus!`);

        if (idleAction) idleAction.stop();

        if (receiveBallAction) {
            receiveBallAction.reset(); // Reset the animation to the start
            receiveBallAction.setLoop(THREE.LoopOnce);
            receiveBallAction.play();

            // Listen for the animation to finish
            mixer.addEventListener('finished', function onFinished(e) {
                console.log('Finished Action:', e.action);
                if (e.action === receiveBallAction) {
                    console.log('ReceiveBall animation finished, returning to idle.');
                    idleAction.reset();
                    idleAction.play();

                    // Remove the event listener to avoid duplicates
                    mixer.removeEventListener('finished', onFinished);
                }
            });
        }

        // Update the HUD
        updateHUD();
    } else {
        console.log(`You do not have ${itemName} in your inventory.`);
    }
}