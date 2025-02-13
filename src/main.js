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
import {
  showDoorPrompt,
  hideDoorPrompt,
  showCodeInput,
  showComboLockInstructions,
  hideComboLockInstructions
} from "./inventoryHUD.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ItemInspector } from "./itemInspection.js";
import {
  showCombinationLockUI,
  hideCombinationLockUI,
} from "./combinationLock.js";
import SoundManager from "./soundManager.js";
import LoadingManagerWrapper from "./loadingManager.js";

// Variables
const loadingManagerWrapper = new LoadingManagerWrapper();
const manager = loadingManagerWrapper.manager;
const mixers = []; // Array to store all animation mixers
let insideHouse = false;
let interiorEnvironment = null; // Track the interior scene
let livingDoor = null;
let inInfiniteHallway = false;
const gltfLoader = new GLTFLoader(manager);
const correctCode = "403"; // Our secret 3-digit code
const hallwayInstances = []; // ✅ Store hallway segments for looping
let hallwayA = null;
let hallwayB = null;
let currentFront = null; // The hallway the player is currently in
let currentBack = null; // The hallway that is behind (and will be repositioned)
const hallwayLength = 32.518; // Exact Blender length
let endDoor = null;
let footstepsPlaying = false;
let currentFootstepSound = null;
let sinkWater = null;
let sinkMixer = null;
let waterDrainClip = null;
let sinkAnimated = false;

window.startScreenActive = true;
window.endGameTriggered = false;
window.allAssetsLoaded = false;
window.instructionsShown = false;

//Audio
const soundManager = new SoundManager(camera, manager);
window.soundManager = soundManager;
soundManager.loadMainTheme("public/audio/thishouse-main.wav");
soundManager.loadHallwayTheme("public/audio/thishouse-hallway.wav");
//soundfx
const fxFiles = [
  "knock.mp3",
  "door-open.wav",
  "pills.wav",
  "sink-off.wav",
  "sink-stream.wav",
  "paper.wav",
];
soundManager.loadSoundEffects(fxFiles, "public/audio/fx");
soundManager.loadFootstepSounds();

function showInstructions() {
  const overlay = document.getElementById("instructionOverlay");
  overlay.style.display = "flex"; // Show the overlay

  // Add a one-time listener for SPACE to dismiss instructions.
  function dismissInstructions(event) {
    if (event.key === " ") {
      document.removeEventListener("keydown", dismissInstructions);
      overlay.style.display = "none"; // Hide the overlay
      startGame(); // Now start the game
    }
  }
  document.addEventListener("keydown", dismissInstructions);
}

//Start handler
function startGameHandler(event) {
  if (event.key === " ") {
    // Check that the main theme buffer is ready.
    if (!window.allAssetsLoaded || !soundManager.mainTheme.buffer) {
      console.log("Assets are still loading. Please wait.");
      const startGamePrompt = document.getElementById("startGamePrompt");
      if (startGamePrompt) {
        startGamePrompt.textContent = "Loading, please wait...";
      }
      return; // Do not start the game yet.
    }
    // Resume the AudioContext if needed.
    if (soundManager.listener.context.state === "suspended") {
      soundManager.listener.context.resume().then(() => {
        console.log("AudioContext resumed");
      });
    }
    soundManager.playMainTheme();
    window.startScreenActive = false;
    document.getElementById("startScreen").style.display = "none";
    // Remove the listener to avoid duplicate calls.
    document.removeEventListener("keydown", startGameHandler);

    if (!window.instructionsShown) {
      window.instructionsShown = true;
      showInstructions();
    }
  }
}
// Attach it to the global window object.
window.startGameHandler = startGameHandler;

function startGame() {
  console.log("Game started!");
  // Add any additional game initialization here.
}

//items to inspect
const noteInspector = new ItemInspector({
  meshName: "note-01001",
  imageURL: "public/char/playgrnd-note-pixel.png",
  inspectDistance: 4,
  promptInspect: "Press Space to Inspect",
  promptExit: "Press Space to Exit",
  soundEffect: "paper.wav",
});

const noteInspector2 = new ItemInspector({
  meshName: "note-02",
  imageURL: "public/char/kitchen-note-pixel.png",
  inspectDistance: 4,
  promptInspect: "Press Space to Inspect",
  promptExit: "Press Space to Exit",
  soundEffect: "paper.wav",
});

const noteInspector3 = new ItemInspector({
  meshName: "med-bottle",
  imageURL: "public/char/pillbottle-pixel.png",
  inspectDistance: 4,
  promptInspect: "Press Space to Inspect",
  promptExit: "Press Space to Exit",
  soundEffect: "pills.wav",
});

// Setup scene and environment
addEnvironment();

// Track keys for movement
trackKeys();

// Function to load the house interior
const loadInterior = () => {
  console.log("Transitioning to house interior...");

  //Play sound
  soundManager.playSoundEffect("door-open.wav");

  // Remove only the exterior objects, keeping camera & lights
  scene.children
    .filter((obj) => obj !== camera && obj !== composer && obj !== renderer)
    .forEach((obj) => scene.remove(obj));

  gltfLoader.load(
    "./public/Char/house-interior3.glb",
    (gltf) => {
      interiorEnvironment = gltf.scene; // ✅ Track the loaded interior
      interiorEnvironment.scale.set(1, 1, 1);
      //interiorEnvironment.position.set(0, -1, 0);
      scene.add(interiorEnvironment);

      interiorEnvironment.traverse((child) => {
        if (child.isMesh) {
          child.visible = true;
        }

        // Collision for invisible collision objects
        if (child.isMesh && child.name.startsWith("collision_")) {
          const boundingBox = new THREE.Box3().setFromObject(child);
          collisionManager.addModel(child, boundingBox);
          child.material.visible = false;
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
      camera.position.set(35, 3.5, 0);
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

      loadModelWithAnimations("./public/Char/sink-water.glb", 1)
        .then((result) => {
          // Directly assign to global variables
          window.sinkWater = result.model;
          window.sinkMixer = result.mixer;
          window.waterDrainClip = result.animations.find(
            (clip) => clip.name === "water-drain"
          );
          window.sinkAnimated = false;

          // Re-center the model geometry:
          const bbox = new THREE.Box3().setFromObject(window.sinkWater);
          const center = new THREE.Vector3();
          bbox.getCenter(center);
          // Shift the sink so that its center is at (0,0,0)
          window.sinkWater.position.sub(center);

          // Now set the desired position in your interior
          window.sinkWater.position.set(43.89, 1.75, 5.66);
          scene.add(window.sinkWater);
          mixers.push(window.sinkMixer);

          window.sinkStreamAudio = soundManager.attachPositionalAudioToObject(
            window.sinkWater,
            "public/audio/fx/sink-stream.wav",
            {
              loop: true,
              volume: 2,
              refDistance: 2,
              maxDistance: 20,
              distanceModel: "linear",
            }
          );

          console.log("Sink water model loaded with animation.");
        })
        .catch((error) => {
          console.error("Error loading sink water model:", error);
        });
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
  soundManager.playSoundEffect("door-open.wav");

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
  camera.position.set(28, 3, 0);
  camera.updateMatrixWorld(true);

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
    //console.log("Distance to exteriorDoor:", distance);

    if (distance < 2) {
      showDoorPrompt("Press SPACE to Enter");
      console.log("Showing Door prompt");
      promptShown = true;
      if (keys[" "]) {
        hideDoorPrompt();
        loadInterior();

        return; // ✅ Stops further execution in this frame
      }
    } else {
      hideDoorPrompt();
    }
  }

  //   if (insideHouse && interiorDoor) {
  //     // Get the door's world position.
  //     const doorWorldPosition = new THREE.Vector3();
  //     interiorDoor.getWorldPosition(doorWorldPosition);

  //     // Compute horizontal distance only (ignore y difference).
  //     const cameraHorizontal = new THREE.Vector2(camera.position.x, camera.position.z);
  //     const doorHorizontal = new THREE.Vector2(doorWorldPosition.x, doorWorldPosition.z);
  //     const horizontalDistance = cameraHorizontal.distanceTo(doorHorizontal);
  //     // console.log("Horizontal distance to interiorDoor:", horizontalDistance);

  //     if (horizontalDistance < 1.5) {
  //       console.log("✅ Showing prompt: Press SPACE to Exit");
  //       showPrompt("Press SPACE to Exit");
  //       if (keys[" "]) {
  //         hidePrompt();
  //         loadExterior();
  //         return;
  //       }
  //     } else {
  //       hidePrompt();
  //     }
  //   }

  if (!exteriorDoor && !interiorDoor && !livingDoor) return; // If no doors exist, don't run

  if (insideHouse && interiorDoor) {
    // Handle exiting the house based on horizontal distance (ignoring y)
    const doorWorldPosition = new THREE.Vector3();
    interiorDoor.getWorldPosition(doorWorldPosition);

    // Calculate the horizontal distance (x and z only)
    const dx = camera.position.x - doorWorldPosition.x;
    const dz = camera.position.z - doorWorldPosition.z;
    const horizontalDistance = Math.sqrt(dx * dx + dz * dz);

    if (horizontalDistance < 1.5) {
      console.log("✅ Showing prompt: Press SPACE to Exit");
      showDoorPrompt("Press SPACE to Exit");
      promptShown = true;

      if (keys[" "]) {
        hideDoorPrompt();
        loadExterior();
        return;
      }
    } else {
      hideDoorPrompt();
    }
  }

  if (insideHouse && livingDoor) {
    // Handle unlocking the hallway door
    const doorWorldPosition = new THREE.Vector3();
    livingDoor.getWorldPosition(doorWorldPosition);
    const distance = camera.position.distanceTo(doorWorldPosition);

    if (distance < 2) {
      showDoorPrompt("Press SPACE to Unlock");
      promptShown = true;
      

      if (keys[" "]) {
        showCombinationLockUI();
        keys[" "] = false;
        showComboLockInstructions();
      }
    }
  }

  if (!promptShown) {
    hideDoorPrompt();
  }
};

const loadInfiniteHallway = () => {
  soundManager.playSoundEffect("door-open.wav");
  hideDoorPrompt();
  console.log("🚪 Entering infinite hallway...");
  inInfiniteHallway = true;

  // Start the knock timer (30 seconds)
  window.hallwayKnockTimer = setTimeout(() => {
    // If the door hasn’t been loaded or triggered, play the knock sound.
    if (!window.endGameTriggered && !endDoor) {
      console.log("30 seconds passed in the hallway—playing knock sound.");
      soundManager.playSoundEffect("knock.mp3");
    }
  }, 30000); // 30000 milliseconds = 30 seconds

  // Clear out the previous scene (except camera and renderer)
  scene.children
    .filter((obj) => obj !== camera && obj !== composer && obj !== renderer)
    .forEach((obj) => scene.remove(obj));

  resetLighting();
  scene.background = new THREE.Color(0x000000); // Dark skybox
  scene.fog = new THREE.Fog(0x000000, 0, 15);

  console.log(camera.position);
  camera.position.set(47, 3.5, -31);

  // Load the first hallway segment (Hallway A)
  gltfLoader.load(
    "./public/Char/infin-hallwy3.glb",
    (gltf) => {
      hallwayA = gltf.scene;
      hallwayA.scale.set(1, 1, 1);
      hallwayA.position.set(0, -1, 0); // Start position
      scene.add(hallwayA);
      console.log(`✅ Hallway A loaded at Z = ${hallwayA.position.z}`);

      hallwayA.traverse((child) => {
        if (child.isMesh && child.name.startsWith("collision_")) {
          console.log("Found collision object in Hallway A:", child.name);
          // Optionally, add it to your collision manager:
          const boundingBox = new THREE.Box3().setFromObject(child);
          collisionManager.addModel(child, boundingBox);
          child.material.visible = false;
        }
      });

      // Now load the second hallway (Hallway B) behind it
      gltfLoader.load(
        "./public/Char/infin-hallwy3.glb",
        (gltf2) => {
          hallwayB = gltf2.scene;
          hallwayB.scale.set(1, 1, 1);
          // Position it immediately after hallway A.
          hallwayB.position.set(0, -1, -hallwayLength);
          scene.add(hallwayB);
          console.log(`✅ Hallway B loaded at Z = ${hallwayB.position.z}`);

          hallwayB.traverse((child) => {
            if (child.isMesh && child.name.startsWith("collision_")) {
              console.log("Found collision object in Hallway B:", child.name);
              // Optionally, add it to your collision manager:
              const boundingBox = new THREE.Box3().setFromObject(child);
              collisionManager.addModel(child, boundingBox);
              child.material.visible = false;
            }
          });

          // Set our initial roles:
          // The front segment (the one the player is in) is the one with the lower Z.
          // In our case, hallwayB is in front because -hallwayLength is less than 0.
          currentFront = hallwayB;
          currentBack = hallwayA;

          // Start tracking player progress
          trackPlayerProgress();
        },
        undefined,
        (error) => {
          console.error("❌ Error loading second hallway:", error);
        }
      );
    },
    undefined,
    (error) => {
      console.error("❌ Error loading first hallway:", error);
    }
  );
};

function transitionToInfiniteHallway() {
  soundManager.stopMainTheme();
  soundManager.playHallwayTheme();
  loadInfiniteHallway(); // Your existing function to transition the scene.
}

window.transitionToInfiniteHallway = transitionToInfiniteHallway;

const trackPlayerProgress = () => {
  // Define a threshold – when the player reaches 75% into the current front segment,
  // reposition the back segment in front.
  const threshold = currentFront.position.z - hallwayLength;

  // Because our player is moving in the negative Z direction, once the camera's z
  // becomes less than or equal to the threshold, it means they've advanced enough.
  if (camera.position.z <= threshold) {
    console.log(
      `🔄 Player reached threshold (camera.z: ${camera.position.z} <= ${threshold})`
    );
    // Reposition the back segment to be directly in front of the current front segment.
    // That is, set its z to currentFront.z - hallwayLength.
    currentBack.position.z = currentFront.position.z - hallwayLength;
    console.log(`🚨 Moved back segment to Z = ${currentBack.position.z}`);

    // Swap the roles: the one we just moved becomes the new front.
    const temp = currentFront;
    currentFront = currentBack;
    currentBack = temp;
  }

  // Keep checking on the next animation frame.
  requestAnimationFrame(trackPlayerProgress);
};

// Updated checkCollision function
const checkCollision = (newPosition) => {
  return collisionManager.checkCollision(newPosition);
};

const checkEndDoorAppearance = () => {
  if (window.endGameTriggered) return;
  // Only run this logic when we are in the infinite hallway.
  if (!inInfiniteHallway) {
    if (endDoor) {
      scene.remove(endDoor);
      endDoor = null;
      console.log("🚪 End door removed (not in infinite hallway).");
    }
    return;
  }

  // Get the camera's current world direction.
  const cameraDir = new THREE.Vector3();
  camera.getWorldDirection(cameraDir);

  // Define the hallway's forward direction (players normally walk along -Z).
  const hallwayForward = new THREE.Vector3(0, 0, -1);

  // If the camera is turned around (i.e. facing opposite the hallway's forward),
  // then load the door.
  if (cameraDir.dot(hallwayForward) < 0) {
    // Use currentFront (the hallway segment the player is in) as our reference.
    if (!endDoor && currentFront) {
      const doorDistance = 4;

      let computedDoorZ = camera.position.z + doorDistance;
      if (computedDoorZ > currentFront.position.z) {
        computedDoorZ = currentFront.position.z;
      }

      let doorPos = new THREE.Vector3(
        47.1 - 1.89, // Fixed x (hallway center)
        -1, // Fixed y (to match other scenes)
        computedDoorZ // Subtract doorDistance from the camera's z
      );

      console.log("Computed doorPos:", doorPos);
      console.log("Camera coordinates:", camera.position);

      // Load the door model.
      gltfLoader.load(
        "./public/Char/end-door2.glb",
        (gltf) => {
          // Assume gltf.scene is your door object.
          const doorOriginal = gltf.scene;

          // Create a new group that will serve as the door's pivot.
          const doorPivotGroup = new THREE.Group();

          // Compute the bounding box of the door.
          const bbox = new THREE.Box3().setFromObject(doorOriginal);
          const size = bbox.getSize(new THREE.Vector3());

          // For example, if you want the door to swing open from its left side,
          // you want the pivot at the left edge. In the door's local space, if the door's
          // geometry is centered, then the left edge is at -size.x/2.
          // To shift the geometry so that its left edge aligns with the group's origin,
          // move the door by +size.x/2 along the x-axis.
          doorOriginal.position.x = size.x / 2;

          // Add the door model to the pivot group.
          doorPivotGroup.add(doorOriginal);

          // Now, doorPivotGroup's origin (0,0,0) corresponds to the left edge of the door.
          // Use doorPivotGroup as your endDoor.
          endDoor = doorPivotGroup;

          // Set scale, position, and rotation as needed.
          endDoor.scale.set(1, 1, 1);
          endDoor.position.copy(doorPos);
          // (Optional) Copy the rotation from currentFront so it aligns with the hallway.
          endDoor.rotation.copy(currentFront.rotation);
          scene.add(endDoor);

          console.log("✅ End door loaded at", doorPos);

          // Show a door prompt (optional) so the player knows to press SPACE.
          showDoorPrompt("Press SPACE to Open");

          // Cancel the knock timer because the door is now loaded.
          if (window.hallwayKnockTimer) {
            clearTimeout(window.hallwayKnockTimer);
            window.hallwayKnockTimer = null;
          }
        },
        undefined,
        (error) => {
          console.error("❌ Error loading end door:", error);
        }
      );
    } else if (endDoor && !window.endGameTriggered) {
      // If the end door is already loaded and visible, check for interaction.
      // (For instance, the door prompt is already shown.)
      if (keys[" "]) {
        keys[" "] = false;
        window.endGameTriggered = true;
        // Trigger the end game transition:
        triggerEndGameTransition();
      }
    }
  } else {
    // If the camera is not turned around, remove the door (if present).
    if (endDoor) {
      scene.remove(endDoor);
      endDoor = null;
      console.log("🚪 End door removed (camera facing forward).");
    }
  }
};

//For debugging and finding mesh names
function logSceneNames(object, depth = 0) {
  console.log(" ".repeat(depth * 2) + object.name);
  object.children.forEach((child) => logSceneNames(child, depth + 1));
}

//Also for debugging only
function addCollisionOutlines(scene) {
  scene.traverse((child) => {
    if (child.isMesh && child.name.startsWith("collision_")) {
      // Create an EdgesGeometry from the child's geometry.
      const edges = new THREE.EdgesGeometry(child.geometry);
      // Create a line material with a red color.
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
      // Create line segments from the edges.
      const outline = new THREE.LineSegments(edges, lineMaterial);
      // Optionally, adjust renderOrder to make sure the outline is visible on top.
      outline.renderOrder = 1;
      // Add the outline as a child of the collision mesh.
      child.add(outline);
      // If the collision object was hidden (child.material.visible = false), you might want to re-enable it for debugging:
      // child.material.visible = true;
    }
  });
}

function updateFootstepSound() {
  //debugging
  //console.log("insideHouse:", insideHouse, "inInfiniteHallway:", inInfiniteHallway);

  // Determine if the player is moving (using your keys, for example)
  const isMoving =
    keys["w"] ||
    keys["a"] ||
    keys["s"] ||
    keys["d"] ||
    keys["ArrowUp"] ||
    keys["ArrowDown"] ||
    keys["ArrowLeft"] ||
    keys["ArrowRight"];

  // Determine which footstep sound to play:
  let desiredFootstep;
  if (inInfiniteHallway) {
    desiredFootstep = soundManager.footstepsHallway;
  } else if (insideHouse) {
    desiredFootstep = soundManager.footstepsInside;
  } else {
    desiredFootstep = soundManager.footstepsOutside;
  }

  // If the player is moving and the desired footstep sound is not already playing:
  if (isMoving) {
    // If no footstep sound is currently playing, or the wrong one is playing:
    if (!footstepsPlaying || currentFootstepSound !== desiredFootstep) {
      // Stop any currently playing footsteps.
      soundManager.stopAllFootsteps();
      // Start the desired footstep sound.
      currentFootstepSound = desiredFootstep;
      if (currentFootstepSound === soundManager.footstepsHallway) {
        soundManager.playFootstepsHallway();
      } else if (currentFootstepSound === soundManager.footstepsInside) {
        soundManager.playFootstepsInside();
      } else if (currentFootstepSound === soundManager.footstepsOutside) {
        soundManager.playFootstepsOutside();
      }
      footstepsPlaying = true;
    }
  } else {
    // If the player is not moving and footsteps are playing, stop them.
    if (footstepsPlaying) {
      soundManager.stopAllFootsteps();
      footstepsPlaying = false;
      currentFootstepSound = null;
    }
  }
}

function triggerEndGameTransition() {
  // Ensure the overlay is visible in the DOM.
  const overlay = document.getElementById("endGameOverlay");

  // --- Animate the Door Swing ---
  // Assume endDoor is your door model that has just been loaded.
  // We want to rotate the door about its y-axis (for example, by 90 degrees).
  // Adjust these values based on your door model’s pivot and desired effect.
  const duration = 2000; // Duration in milliseconds (2 seconds)
  const startRotation = endDoor.rotation.y;
  const targetRotation = startRotation + Math.PI / 2; // Rotate 90° counterclockwise
  const startTime = performance.now();

  function animateDoor(time) {
    const elapsed = time - startTime;
    const t = Math.min(elapsed / duration, 1); // Interpolation factor from 0 to 1
    // Linear interpolation; you could use easing for smoother effect.
    endDoor.rotation.y = startRotation + t * (targetRotation - startRotation);
    if (t < 1) {
      requestAnimationFrame(animateDoor);
    }
  }
  requestAnimationFrame(animateDoor);

  // --- Fade in the White Overlay ---
  // Use CSS transitions to fade the overlay from transparent to opaque.
  overlay.style.transition = "opacity 1.5s ease-in-out";
  overlay.style.opacity = 1;

  //     setTimeout(() => {
  //     const endGameText = document.getElementById("endGameText");
  //     endGameText.style.opacity = 1;
  //   }, 1500);  // Adjust delay as needed so it appears at the right time.

  // After the transition completes, you might restart the game.
  setTimeout(() => {
    // Reset state, e.g. reload the page:
    window.location.reload();
    // Or, if you have a game reset function, call it here.
  }, 4000); // Adjust duration as needed.
}

function checkSinkInteraction() {
  if (window.sinkWater && !window.sinkAnimated) {
    const sinkPos = new THREE.Vector3();
    window.sinkWater.getWorldPosition(sinkPos);
    const distance = camera.position.distanceTo(sinkPos);
    const threshold = 3.5; // adjust as needed

    // Get the sink prompt element
    const sinkPrompt = document.getElementById("sinkPrompt");

    if (distance < threshold) {
      // Show the prompt
      if (sinkPrompt) {
        sinkPrompt.textContent = "SPACE to turn off";
        sinkPrompt.style.display = "block";
      }
      // Check for player interaction
      if (keys[" "]) {
        // Hide the prompt and trigger the animation
        if (sinkPrompt) {
          sinkPrompt.style.display = "none";
        }
        if (window.sinkStreamAudio && window.sinkStreamAudio.isPlaying) {
          window.sinkStreamAudio.stop();
        }
        soundManager.playSoundEffect("sink-off.wav");
        const action = window.sinkMixer.clipAction(window.waterDrainClip);
        action.reset();
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        action.play();
        window.sinkAnimated = true;
        console.log("Sink water animation triggered by interaction.");
        keys[" "] = false; // Reset SPACE key to prevent immediate re-trigger
      }
    } else {
      // If the player is too far, hide the prompt.
      if (sinkPrompt) {
        sinkPrompt.style.display = "none";
      }
    }
  }
}

// Animation Loop
const clock = new THREE.Clock();
const animate = () => {
  requestAnimationFrame(animate);

  // Handle camera movement
  moveCamera(checkCollision);

  const delta = clock.getDelta(); // Time since last frame

  // Update all mixers
  mixers.forEach((mixer) => mixer.update(delta));

  if (inInfiniteHallway) {
    if (hallwayA) collisionManager.updateCollisionBoxes(hallwayA);
    if (hallwayB) collisionManager.updateCollisionBoxes(hallwayB);
  }

  // ✅ Ensure door interaction check happens continuously
  checkDoorInteraction();
  checkEndDoorAppearance();
  checkSinkInteraction();

  // Update the item inspector
  noteInspector.update(scene, camera);
  noteInspector2.update(scene, camera);
  noteInspector3.update(scene, camera);

  //debugging only
  // addCollisionOutlines(scene);

  updateFootstepSound();

  // Render using the composer
  composer.render(delta);

  //    debugging only
  //   logSceneNames(scene);
};
animate();
