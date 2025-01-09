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

export function giveItemToTorus(itemName) {
    // Check if the item exists in the inventory
    if (playerInventory.items.includes(itemName)) {
        // Remove the item from the inventory
        playerInventory.removeItem(itemName);
        console.log(`${itemName} given to the torus!`);

        // Update the HUD
        updateHUD();
    } else {
        console.log(`You do not have ${itemName} in your inventory.`);
    }
}