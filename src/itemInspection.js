// itemInspection.js
import * as THREE from "three";
import { showItemPrompt, hideItemPrompt } from "./inventoryHUD.js";
import { keys } from "./playerMovement.js"; // assuming keys is exported here

/**
 * ItemInspector checks if the camera is near a target mesh.
 * When the camera is close enough, it shows a prompt.
 * On pressing Space, it toggles an overlay image.
 */
class ItemInspector {
  /**
   * @param {Object} options - configuration options
   * @param {string} options.meshName - name of the target mesh in the scene (e.g., "note2")
   * @param {string} options.imageURL - URL/path of the image to display (e.g., "public/char/playgrnd-note-pixel.png")
   * @param {number} [options.inspectDistance=1] - distance threshold to trigger inspection (in world units)
   * @param {string} [options.promptInspect="Press Space to Inspect"] - prompt when near the item
   * @param {string} [options.promptExit="Press Space to Exit"] - prompt when viewing the item
   */
  constructor(options) {
    this.meshName = options.meshName;
    this.imageURL = options.imageURL;
    this.inspectDistance = options.inspectDistance || 3;
    this.promptInspect = options.promptInspect || "Press Space to Inspect";
    this.promptExit = options.promptExit || "Press Space to Exit";
    this.active = false; // whether the inspector is active (overlay is shown)
    this.inspectionDiv = null; // overlay DOM element
    this.itemMesh = null; // the target mesh from the scene
  }

  /**
   * Call this each frame (from your main animate/update loop).
   * @param {THREE.Scene} scene - your scene
   * @param {THREE.Camera} camera - your camera
   */
  update(scene, camera) {
    // Try to find the target mesh by name once
    if (!this.itemMesh) {
      this.itemMesh = scene.getObjectByName(this.meshName);
      if (!this.itemMesh) {
        return; // target not found; might not be loaded yet
      }
    }

    // If we’re in inspection mode, check for exit key.
    if (this.active) {
      if (keys[" "]) {
        this.exitInspection();
        keys[" "] = false; // reset key so it doesn't immediately toggle again
      }
      return; // when active, do nothing else
    }

    // Otherwise, check the distance from the camera to the target.
    const itemWorldPosition = new THREE.Vector3();
    this.itemMesh.getWorldPosition(itemWorldPosition);
    // For example, use the horizontal distance (x,z) if you want to ignore height:
    const dx = camera.position.x - itemWorldPosition.x;
    const dz = camera.position.z - itemWorldPosition.z;
    const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
    // You can also use the full 3D distance:
    // const fullDistance = camera.position.distanceTo(itemWorldPosition);
    

    if (horizontalDistance < this.inspectDistance) {
      // Show the prompt if not already shown
      showItemPrompt(this.promptInspect);
      if (keys[" "]) {
        hideItemPrompt();
        this.enterInspection();
        keys[" "] = false;
      }
    } else {
      hideItemPrompt();
    }
  }

  /**
   * Enters inspection mode: displays the overlay with the image and changes the prompt.
   */
  enterInspection() {
    this.active = true;
    // Create the overlay div if it doesn't exist yet
    if (!this.inspectionDiv) {
      this.inspectionDiv = document.createElement("div");
      this.inspectionDiv.id = "item-inspection-overlay";
      // Style it to cover the viewport
      Object.assign(this.inspectionDiv.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.8)", // semi-transparent black background
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: "1000",
      });
      // Create an img element for the item image
      const img = document.createElement("img");
      img.src = this.imageURL;
      // Optionally, style the image (e.g., max width/height)
      Object.assign(img.style, {
        maxWidth: "90%",
        maxHeight: "90%",
      });
      this.inspectionDiv.appendChild(img);
      document.body.appendChild(this.inspectionDiv);
    } else {
      this.inspectionDiv.style.display = "flex";
    }
    // Change the HUD prompt to tell the user how to exit
    showItemPrompt(this.promptExit);
  }

  /**
   * Exits inspection mode: hides the overlay.
   */
  exitInspection() {
    this.active = false;
    if (this.inspectionDiv) {
      this.inspectionDiv.style.display = "none";
    }
    hideItemPrompt();
  }
}

export { ItemInspector };