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

export function showPrompt(message) {
    const promptElement = document.getElementById('interactionPrompt');
    if (promptElement) {
        promptElement.textContent = message; // Set the message
        promptElement.style.display = 'block'; // Show the prompt
    }
}

export function hidePrompt() {
    const promptElement = document.getElementById('interactionPrompt');
    if (promptElement) {
        promptElement.style.display = 'none'; // Hide the prompt
    }
}