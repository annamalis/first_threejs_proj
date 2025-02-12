import * as THREE from "three";

class LoadingManagerWrapper {
  constructor() {
    this.allAssetsLoaded = false;
    this.manager = new THREE.LoadingManager();

    this.manager.onStart = (url, itemsLoaded, itemsTotal) => {
      console.log(`Started loading: ${url} (${itemsLoaded} of ${itemsTotal}).`);
    };

    this.manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      console.log(`Loading: ${url} (${itemsLoaded} of ${itemsTotal}).`);
    };

    this.manager.onError = (url) => {
      console.error(`Error loading: ${url}`);
    };

    this.manager.onLoad = () => {
      console.log("All assets loaded.");
      this.allAssetsLoaded = true;
      window.allAssetsLoaded = true;
      const startGamePrompt = document.getElementById("startGamePrompt");
      if (startGamePrompt) {
        startGamePrompt.textContent = "Press SPACE to start";
      }
      // Call a function to attach the key listener.
      enableStartScreen();
      // Clear the fallback timer if it exists.
      if (this.fallbackTimer) {
        clearTimeout(this.fallbackTimer);
      }
    };

    // Start the fallback timer immediately.
    this.fallbackTimer = setTimeout(() => {
      if (!window.allAssetsLoaded) {
        console.warn("Fallback: Not all assets loaded in time. Forcing start.");
        window.allAssetsLoaded = true;
        const startGamePrompt = document.getElementById("startGamePrompt");
        if (startGamePrompt) {
          startGamePrompt.textContent = "Press SPACE to start";
        }
        enableStartScreen();
      }
    }, 15000);
  }
}

function enableStartScreen() {
  // Attach the keydown listener now that loading is done.
  document.addEventListener("keydown", window.startGameHandler);
}

export default LoadingManagerWrapper;