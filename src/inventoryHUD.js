import { playerInventory } from './inventoryManager.js';

  /**
 * Updates the on-screen HUD to reflect current inventory items.
 */
export function updateHUD() {
    const hudElement = document.getElementById('inventoryHUD');
    // Make sure the HUD element exists in the DOM
    if (!hudElement) return;
  
    // Convert the items array into a comma-separated string for display
    const itemsString = playerInventory.items.join(', ');
  
    // Set the HUD text
    hudElement.textContent = `Inventory: ${itemsString}`;
  }