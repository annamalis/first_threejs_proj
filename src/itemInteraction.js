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