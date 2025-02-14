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

  export function showDoorPrompt(message, extraMessage = "") {
    const promptElement = document.getElementById('doorPrompt');
    if (promptElement) {
      if (extraMessage.trim() !== "") {
        promptElement.innerHTML = message + "<br>" + extraMessage;
      } else {
        promptElement.textContent = message;
      }
      promptElement.style.display = 'block';
    }
  }
  
  export function hideDoorPrompt() {
    const promptElement = document.getElementById('doorPrompt');
    if (promptElement) {
      promptElement.style.display = 'none';
    }
  }
  
  export function showItemPrompt(message) {
    const promptElement = document.getElementById('itemPrompt');
    if (promptElement) {
      promptElement.textContent = message;
      promptElement.style.display = 'block';
    }
  }
  
  export function hideItemPrompt() {
    const promptElement = document.getElementById('itemPrompt');
    if (promptElement) {
      promptElement.style.display = 'none';
    }
  }

export const showCodeInput = (callback) => {
    // Create input field
    const inputField = document.createElement('input');
    inputField.id = "codeInputField";
    inputField.type = 'text';
    inputField.maxLength = 3; // 3-digit code
    inputField.style.position = 'absolute';
    inputField.style.top = '50%';
    inputField.style.left = '50%';
    inputField.style.transform = 'translate(-50%, -50%)';
    inputField.style.fontSize = '2em';
    document.body.appendChild(inputField);

    // Focus on the input field
    inputField.focus();

    // Handle input submission
    inputField.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            const enteredCode = inputField.value;
            document.body.removeChild(inputField);
            callback(enteredCode); // Pass the code back to the callback
        }
    });
};

export function showDialogue(message) {
    const dialogueElement = document.getElementById('dialogueBox');
    if (dialogueElement) {
      dialogueElement.textContent = message;
      dialogueElement.style.display = 'block';
      // Optionally, automatically hide the dialogue after 3 seconds.
      setTimeout(() => {
        dialogueElement.style.display = 'none';
      }, 3000);
    }
  }
  
  export function hideDialogue() {
    const dialogueElement = document.getElementById('dialogueBox');
    if (dialogueElement) {
      dialogueElement.style.display = 'none';
    }
  }

  export function showComboLockInstructions() {
    const instr = document.getElementById("comboLockInstructions");
    if (instr) {
      instr.style.display = "block";
    }
  }
  
  export function hideComboLockInstructions() {
    const instr = document.getElementById("comboLockInstructions");
    if (instr) {
      instr.style.display = "none";
    }
  }