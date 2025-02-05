import * as THREE from "three";
import {
  scene,
  camera,
  renderer,
  composer,
  resetLighting,
} from "./sceneSetup.js";
import {
  addEnvironment,
  exteriorDoor,
  interiorDoor,
  setInteriorDoor,
} from "./environment.js";
import { loadModel, loadModelWithAnimations } from "./modelLoader.js";
import { trackKeys, moveCamera } from "./playerMovement.js";
import { collisionManager } from "./collisionManager.js";
import { keys } from "./playerMovement.js";
import { showPrompt, hidePrompt, showCodeInput } from "./inventoryHUD.js";
import { playerInventory } from "./inventoryManager.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Variables
const mixers = []; // Array to store all animation mixers
let insideHouse = false;
let interiorEnvironment = null; // Track the interior scene
let livingDoor = null;
let inInfiniteHallway = false;
const gltfLoader = new GLTFLoader();
const correctCode = "123"; // Our secret 3-digit code
const hallwayInstances = []; // ✅ Store hallway segments for looping

// Setup scene and environment
addEnvironment();

// Track keys for movement
trackKeys();

// Function to load the house interior
const loadInterior = () => {
  console.log("Transitioning to house interior...");

  // Remove only the exterior objects, keeping camera & lights
  scene.children
    .filter((obj) => obj !== camera && obj !== composer && obj !== renderer)
    .forEach((obj) => scene.remove(obj));

  gltfLoader.load(
    "./public/Char/house-interior.glb",
    (gltf) => {
      interiorEnvironment = gltf.scene; // ✅ Track the loaded interior
      interiorEnvironment.scale.set(1, 1, 1);
      interiorEnvironment.position.set(0, -1, 0);
      scene.add(interiorEnvironment);

      interiorEnvironment.traverse((child) => {
        if (child.isMesh) {
          child.visible = true;
        }

        // ✅ Use the setter function to update `interiorDoor`
        if (child.name.toLowerCase() === "interior-door") {
          setInteriorDoor(child); // ✅ Correct way to update
          child.updateMatrixWorld(true);
        }

        // Detect living-door for the hallway
        if (child.name.toLowerCase() === "living-door") {
          livingDoor = child;
          livingDoor.updateMatrixWorld(true);
          console.log(
            "✅ Living door detected:",
            livingDoor.getWorldPosition(new THREE.Vector3())
          );
        }
      });

      // ✅ Move the camera inside the house
      camera.position.set(35, 1.5, 0);
      //resetLighting();

      // ✅ Add Ambient Light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      // ✅ Add Directional Light
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(10, 10, 10);
      directionalLight.castShadow = true;
      scene.add(directionalLight);

      console.log("House interior loaded at:", interiorEnvironment.position);
      console.log("Camera moved inside house:", camera.position);
    },
    undefined,
    (error) => {
      console.error("Error loading interior:", error);
    }
  );

  insideHouse = true;
};

//Function to load exterior
const loadExterior = () => {
  console.log("Transitioning to house exterior...");

  // ✅ Prevents interactions for a short time
  insideHouse = null;

  // ✅ Remove interior objects
  if (interiorEnvironment) {
    console.log("✅ Removing interior environment:", interiorEnvironment);
    interiorEnvironment.traverse((child) => {
      scene.remove(child);
    });
    scene.remove(interiorEnvironment);
    interiorEnvironment = null;
  } else {
    console.warn("⚠️ No interior environment found to remove.");
  }

  // ✅ Remove any lingering objects except camera & lights
  scene.children
    .filter((obj) => obj !== camera && obj !== composer && obj !== renderer)
    .forEach((obj) => scene.remove(obj));

  // ✅ Reload the exterior environment
  addEnvironment();
  resetLighting();

  // ✅ Debugging Camera Movement
  console.log("Before exiting, camera position:", camera.position);
  camera.position.set(28, 1.5, 0);
  camera.updateMatrixWorld(true);
  console.log("After exiting, camera position:", camera.position);

  // ✅ Set insideHouse = false **AFTER A SHORT DELAY**
  setTimeout(() => {
    insideHouse = false; // ✅ Now interactions are re-enabled
    console.log("✅ Re-enabling door interactions.");
  }, 500); // Delay re-enabling interactions for 500ms
};

// Check proximity to the exterior OR interior door
const checkDoorInteraction = () => {
  if (insideHouse === null || inInfiniteHallway) return;

  let promptShown = false;

  if (!insideHouse && exteriorDoor) {
    // Handle entering the house
    const doorWorldPosition = new THREE.Vector3();
    exteriorDoor.getWorldPosition(doorWorldPosition);
    const distance = camera.position.distanceTo(doorWorldPosition);

    if (distance < 2) {
      showPrompt("Press SPACE to Enter");
      promptShown = true;
      if (keys[" "]) {
        hidePrompt();
        loadInterior();

        return; // ✅ Stops further execution in this frame
      }
    } else {
      hidePrompt();
    }
  }

  if (insideHouse && interiorDoor) {
    // Handle exiting the house
    const doorWorldPosition = new THREE.Vector3();
    interiorDoor.getWorldPosition(doorWorldPosition);
    const distance = camera.position.distanceTo(doorWorldPosition);

    if (distance < 2) {
      console.log("✅ Showing prompt: Press SPACE to Exit");
      showPrompt("Press SPACE to Exit");
      promptShown = true;

      if (keys[" "]) {
        hidePrompt();
        loadExterior();
        return;
      }
    } else {
      hidePrompt();
    }
  }

  if (!exteriorDoor && !interiorDoor && !livingDoor) return; // If no doors exist, don't run

  if (insideHouse && livingDoor) {
    // Handle unlocking the hallway door
    const doorWorldPosition = new THREE.Vector3();
    livingDoor.getWorldPosition(doorWorldPosition);
    const distance = camera.position.distanceTo(doorWorldPosition);

    if (distance < 2) {
      showPrompt("Press SPACE to Unlock");
      promptShown = true;

      if (keys[" "]) {
        showCodeInput((enteredCode) => {
          if (enteredCode === correctCode) {
            console.log("✅ Code correct! Entering hallway...");
            hidePrompt();
            loadInfiniteHallway();
          } else {
            console.log("❌ Incorrect code.");
            alert("Incorrect code. Try again!");
          }
        });

        // ✅ RESET SPACE KEY so it doesn't trigger twice
        keys[" "] = false;
      }
    }
  }

  if (!promptShown) {
    hidePrompt();
  }
};

const loadInfiniteHallway = () => {
  console.log("🚪 Entering infinite hallway...");
  inInfiniteHallway = true;

  const hallwayLength = 32.518; // ✅ Exact Blender length
  const numHallways = 2; // ✅ We only need two for seamless looping

  // Remove previous environments except camera & renderer
  scene.children
    .filter((obj) => obj !== camera && obj !== composer && obj !== renderer)
    .forEach((obj) => scene.remove(obj));

  resetLighting();

  // Set dark skybox and enable fog
  scene.background = new THREE.Color(0x000000);
  console.log("🌌 Dark skybox & fog enabled.");

  // ✅ Track hallway instances
  const hallwayInstances = [];

  // ✅ Load the first hallway **exactly at (0, -1, 0)**
  gltfLoader.load(
    "./public/Char/infin-hallwy.glb",
    (gltf) => {
      const hallway = gltf.scene;
      hallway.scale.set(1, 1, 1);
      hallway.position.set(0, -1, 0); // ✅ This one stays at (0, -1, 0)

      scene.add(hallway);
      hallwayInstances.push(hallway);
      console.log(`✅ First hallway loaded at: Z = ${hallway.position.z}`);

      // ✅ Load the second hallway behind it
      loadSecondHallway();
    },
    undefined,
    (error) => {
      console.error("❌ Error loading first hallway:", error);
    }
  );

  // ✅ Function to load the second hallway **behind the first**
  const loadSecondHallway = () => {
    gltfLoader.load(
      "./public/Char/infin-hallwy.glb",
      (gltf) => {
        const hallway = gltf.scene;
        hallway.scale.set(1, 1, 1);
        hallway.position.set(0, -1, -hallwayLength); // ✅ Positioned right after Hallway 0

        scene.add(hallway);
        hallwayInstances.push(hallway);
        console.log(`✅ Second hallway loaded at: Z = ${hallway.position.z}`);

        // ✅ Start movement logic **AFTER the player has moved sufficiently**
        trackPlayerProgress();
      },
      undefined,
      (error) => {
        console.error("❌ Error loading second hallway:", error);
      }
    );
  };

  // ✅ Function to track when the player should trigger a hallway shift
  let hallwaySwaps = 0; // Track movement cycles

  const trackPlayerProgress = () => {
    const playerZ = camera.position.z;

    // ✅ Find the farthest hallway (one farthest behind the player)
    const farthestHallway = hallwayInstances.reduce((farthest, hallway) => {
        return hallway.position.z < farthest.position.z ? hallway : farthest;
    }, hallwayInstances[0]);

    // ✅ Move threshold should **NOT shift**
    if (typeof trackPlayerProgress.moveThreshold === 'undefined') {
        trackPlayerProgress.moveThreshold = hallwayInstances[1].position.z - (hallwayLength * 0.75);
        console.log(`🔒 Locked Move Threshold: ${trackPlayerProgress.moveThreshold}`);
    }

    const moveThreshold = trackPlayerProgress.moveThreshold;

    console.log(`🔍 Checking farthest hallway: Z = ${farthestHallway.position.z}, Player Z = ${playerZ}`);
    console.log(`🚦 Move threshold (locked): ${moveThreshold}`);

    // ✅ Wait until the player reaches 75% into the second hallway
    if (playerZ > moveThreshold) {  
        console.log(`✅ Player has NOT reached 75% into the second hallway yet.`);
        requestAnimationFrame(trackPlayerProgress);
        return;
    }

    // ✅ Move the farthest hallway **only when the player crosses the threshold**
    console.log(`🚨 TRIGGER: Moving farthest hallway!`);
    farthestHallway.position.z -= numHallways * hallwayLength;
    console.log(`🔁 Moved farthest hallway to Z = ${farthestHallway.position.z}`);

    // ✅ Reset the move threshold **to the new hallway’s position**
    trackPlayerProgress.moveThreshold -= hallwayLength;

    console.log(`🔄 Hallway cycle completed. New move threshold: ${trackPlayerProgress.moveThreshold}`);

    // ✅ Repeat check to keep the loop going
    requestAnimationFrame(trackPlayerProgress);
};
};

// Updated checkCollision function
const checkCollision = (newPosition) => {
  return collisionManager.checkCollision(newPosition);
};

// Animation Loop
const clock = new THREE.Clock();
const animate = () => {
  requestAnimationFrame(animate);

  // Handle camera movement
  moveCamera(checkCollision);

  const delta = clock.getDelta(); // Time since last frame

  // Update all mixers
  mixers.forEach((mixer) => mixer.update(delta));

  // ✅ Ensure door interaction check happens continuously
  checkDoorInteraction();

  // Render using the composer
  composer.render(delta);
};
animate();
