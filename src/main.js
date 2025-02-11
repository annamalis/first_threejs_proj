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
} from "./inventoryHUD.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ItemInspector } from "./itemInspection.js";
import { showCombinationLockUI, hideCombinationLockUI } from './combinationLock.js';
import SoundManager from './soundManager.js';


// Variables
const mixers = []; // Array to store all animation mixers
let insideHouse = false;
let interiorEnvironment = null; // Track the interior scene
let livingDoor = null;
let inInfiniteHallway = false;
const gltfLoader = new GLTFLoader();
const correctCode = "123"; // Our secret 3-digit code
const hallwayInstances = []; // ✅ Store hallway segments for looping
let hallwayA = null;
let hallwayB = null;
let currentFront = null; // The hallway the player is currently in
let currentBack = null; // The hallway that is behind (and will be repositioned)
const hallwayLength = 32.518; // Exact Blender length
let endDoor = null;
let footstepsPlaying = false;
let currentFootstepSound = null; 
window.startScreenActive = true;

//Audio
const soundManager = new SoundManager(camera);
soundManager.loadMainTheme("public/audio/thishouse-main.wav");
soundManager.loadHallwayTheme("public/audio/thishouse-hallway.wav");
//soundfx
const fxFiles = [
    "knock.mp3",
    "door-open.mp3",
    "pills.wav",
    "sink-off.wav",
    "sink-stream.wav",
    "paper.wav"
  ];
  soundManager.loadSoundEffects(fxFiles, "public/audio/fx");
  soundManager.loadFootstepSounds();
//debugging
window.soundManager = soundManager;

//Start button for testing audio
document.addEventListener("keydown", function startGameHandler(event) {
    if (event.key === " ") {  // SPACE key
      // Optionally, resume AudioContext here if needed.
      if (soundManager.listener.context.state === 'suspended') {
        soundManager.listener.context.resume().then(() => {
          console.log("AudioContext resumed");
        });
      }
      // Start the main theme.
      soundManager.playMainTheme();

      window.startScreenActive = false;
  
      // Hide the start screen.
      const startScreen = document.getElementById("startScreen");
      startScreen.style.display = "none";
      // Remove this event listener now that the game has started.
      document.removeEventListener("keydown", startGameHandler);
    }
  });

//items to inspect
const noteInspector = new ItemInspector({
  meshName: "note-01001",
  imageURL: "public/char/playgrnd-note-pixel.png",
  inspectDistance: 4,
  promptInspect: "Press Space to Inspect",
  promptExit: "Press Space to Exit",
  soundEffect: "paper.wav"
});

const noteInspector2 = new ItemInspector({
  meshName: "note-02",
  imageURL: "public/char/kitchen-note-pixel.png",
  inspectDistance: 4,
  promptInspect: "Press Space to Inspect",
  promptExit: "Press Space to Exit",
  soundEffect: "paper.wav"
});

const noteInspector3 = new ItemInspector({
  meshName: "med-bottle",
  imageURL: "public/char/pillbottle-pixel.png",
  inspectDistance: 4,
  promptInspect: "Press Space to Inspect",
  promptExit: "Press Space to Exit",
  soundEffect: "pills.wav"
});

// Setup scene and environment
addEnvironment();

// Track keys for movement
trackKeys();

// Function to load the house interior
const loadInterior = () => {
  console.log("Transitioning to house interior...");

  //Play sound
  soundManager.playSoundEffect("door-open.mp3");

  // Remove only the exterior objects, keeping camera & lights
  scene.children
    .filter((obj) => obj !== camera && obj !== composer && obj !== renderer)
    .forEach((obj) => scene.remove(obj));

  gltfLoader.load(
    "./public/Char/house-interior2.glb",
    (gltf) => {
      interiorEnvironment = gltf.scene; // ✅ Track the loaded interior
      interiorEnvironment.scale.set(1, 1, 1);
      interiorEnvironment.position.set(0, -1, 0);
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
      camera.position.set(35, 3, 0);
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
  soundManager.playSoundEffect("door-open.mp3");

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
      console.log("Showing Door prompt")
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
        
        // showCodeInput((enteredCode) => {
        //   if (enteredCode === correctCode) {
        //     console.log("✅ Code correct! Entering hallway...");
        //     hideDoorPrompt();
        //     loadInfiniteHallway();
        //   } else {
        //     console.log("❌ Incorrect code.");
        //     alert("Incorrect code. Try again!");
        //   }
        // });

        // ✅ RESET SPACE KEY so it doesn't trigger twice
        keys[" "] = false;
      }
    }
  }

  if (!promptShown) {
    hideDoorPrompt();
  }
};

const loadInfiniteHallway = () => {
    soundManager.playSoundEffect("door-open.mp3");
    hideDoorPrompt();
  console.log("🚪 Entering infinite hallway...");
  inInfiniteHallway = true;

  // Clear out the previous scene (except camera and renderer)
  scene.children
    .filter((obj) => obj !== camera && obj !== composer && obj !== renderer)
    .forEach((obj) => scene.remove(obj));

  resetLighting();
  scene.background = new THREE.Color(0x000000); // Dark skybox
  scene.fog = new THREE.Fog(0x000000, 0, 15);

  console.log(camera.position);
  camera.position.set(47, 3, -31);

  // Load the first hallway segment (Hallway A)
  gltfLoader.load(
    "./public/Char/infin-hallwy2.glb",
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
        "./public/Char/infin-hallwy2.glb",
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
        47.1, // Fixed x (hallway center)
        -1, // Fixed y (to match other scenes)
        computedDoorZ // Subtract doorDistance from the camera's z
      );

      console.log("Computed doorPos:", doorPos);
      console.log("Camera coordinates:", camera.position);

      // Load the door model.
      gltfLoader.load(
        "./public/Char/end-door.glb",
        (gltf) => {
          endDoor = gltf.scene;
          endDoor.scale.set(1, 1, 1);
          endDoor.position.copy(doorPos);
          // Align the door's rotation with currentFront so it appears flush with the hallway.
          endDoor.rotation.copy(currentFront.rotation);
          scene.add(endDoor);
          console.log("✅ End door loaded at", doorPos);

          // Show a door prompt (optional) so the player knows to press SPACE.
          showDoorPrompt("Press SPACE to Open");

          
        },
        undefined,
        (error) => {
          console.error("❌ Error loading end door:", error);
        }
      );
    } else if (endDoor) {
        // If the end door is already loaded and visible, check for interaction.
        // (For instance, the door prompt is already shown.)
        if (keys[" "]) {
          keys[" "] = false;
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
    console.log("insideHouse:", insideHouse, "inInfiniteHallway:", inInfiniteHallway);

    // Determine if the player is moving (using your keys, for example)
    const isMoving = keys["w"] || keys["a"] || keys["s"] || keys["d"] ||
                     keys["ArrowUp"] || keys["ArrowDown"] || keys["ArrowLeft"] || keys["ArrowRight"];
    
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
    const targetRotation = startRotation - Math.PI / 2; // Rotate 90° counterclockwise
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
    overlay.style.transition = "opacity 2s ease-in-out";
    overlay.style.opacity = 1;
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

