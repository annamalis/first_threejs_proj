import { showDialogue } from "./inventoryHUD.js";
import { hideComboLockInstructions } from "./inventoryHUD.js";

// --- State for the combination lock ---
const comboLockState = {
  // Active slot: 0 for top, 1 for mid, 2 for bottom
  activeSlot: 0,
  // Digits for each slot; initial values can be 0
  digits: [0, 0, 0],
};

// --- Helper to update the UI elements based on the state ---
// This function assumes that your HTML contains the following IDs:
// "comboLockBg" (lock background),
// "digitTop", "digitMid", "digitBot" (the digit images),
// and "arrowTop", "arrowMid", "arrowBot" (the arrow indicator images).
function updateComboLockUI() {
  // Update digit images using your file path structure.
  document.getElementById(
    "digitTop"
  ).src = `public/char/lock/lock-top-${comboLockState.digits[0]}.png`;
  document.getElementById(
    "digitMid"
  ).src = `public/char/lock/lock-mid-${comboLockState.digits[1]}.png`;
  document.getElementById(
    "digitBot"
  ).src = `public/char/lock/lock-bot-${comboLockState.digits[2]}.png`;

  // Hide all arrow indicators.
  document.getElementById("arrowTop").style.display = "none";
  document.getElementById("arrowMid").style.display = "none";
  document.getElementById("arrowBot").style.display = "none";

  // Show the arrow corresponding to the active slot.
  if (comboLockState.activeSlot === 0) {
    document.getElementById("arrowTop").style.display = "block";
  } else if (comboLockState.activeSlot === 1) {
    document.getElementById("arrowMid").style.display = "block";
  } else if (comboLockState.activeSlot === 2) {
    document.getElementById("arrowBot").style.display = "block";
  }
}

// --- Key handler for the combination lock UI ---
// The controls are now switched so that:
// • Left/Right arrows change the digit for the active slot.
// • Up/Down arrows change the active slot.
function handleComboLockInput(event) {
  // Prevent default behavior (such as scrolling)
  event.preventDefault();

  if (event.key === "ArrowLeft") {
    // Left arrow: decrease the current slot's digit (wrap from 0 to 9)
    const slot = comboLockState.activeSlot;
    comboLockState.digits[slot] = (comboLockState.digits[slot] + 9) % 10;
    updateComboLockUI();
  } else if (event.key === "ArrowRight") {
    // Right arrow: increase the current slot's digit (wrap from 9 to 0)
    const slot = comboLockState.activeSlot;
    comboLockState.digits[slot] = (comboLockState.digits[slot] + 1) % 10;
    updateComboLockUI();
  } else if (event.key === "ArrowUp") {
    // Up arrow: move the active slot up.
    // For a 3-slot lock, moving up from the top slot (0) should wrap to the bottom (2).
    comboLockState.activeSlot = (comboLockState.activeSlot + 2) % 3;
    updateComboLockUI();
  } else if (event.key === "ArrowDown") {
    // Down arrow: move the active slot down.
    comboLockState.activeSlot = (comboLockState.activeSlot + 1) % 3;
    updateComboLockUI();
  } else if (event.key === " ") {
    // Confirm the input. Concatenate the digits into a code.
    const code = comboLockState.digits.join("");
    // Replace "123" with your secret code.
    if (code === "403") {
      showDialogue("Code correct! Entering...");
      hideCombinationLockUI();
      hideComboLockInstructions()
      // Here you would trigger the transition to the infinite hallway.
      window.transitionToInfiniteHallway();
    } else {
        showDialogue("Incorrect code. Try again.");
    }
  } else if (event.key === "Escape") {
    // Cancel the combination lock UI.
    hideCombinationLockUI();
    hideComboLockInstructions();
  }
}

// --- Functions to show/hide the combination lock UI overlay ---
function showCombinationLockUI() {
  // Show the overlay container.
  const container = document.getElementById("comboLockContainer");
  container.style.display = "block";

  // Optionally, reset the lock state when showing the UI.
  comboLockState.activeSlot = 0;
  comboLockState.digits = [0, 0, 0];
  updateComboLockUI();

  // Set the flag so that camera movement stops
  window.comboLockActive = true;

  // Add the keydown event listener for handling input.
  document.addEventListener("keydown", handleComboLockInput);
}

function hideCombinationLockUI() {
  // Hide the overlay container.
  const container = document.getElementById("comboLockContainer");
  container.style.display = "none";

  window.comboLockActive = false;

  // Remove the keydown event listener.
  document.removeEventListener("keydown", handleComboLockInput);
}

// Export the functions so they can be used in other modules.
export { showCombinationLockUI, hideCombinationLockUI, updateComboLockUI };
