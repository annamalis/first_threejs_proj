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
let hallwayA = null;
let hallwayB = null;
let currentFront = null; // The hallway the player is currently in
let currentBack = null; // The hallway that is behind (and will be repositioned)
const hallwayLength = 32.518; // Exact Blender length
let endDoor = null;

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
    console.log("Horizontal distance to interiorDoor:", horizontalDistance);
  
    if (horizontalDistance < .5) {
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

  // Clear out the previous scene (except camera and renderer)
  scene.children
    .filter((obj) => obj !== camera && obj !== composer && obj !== renderer)
    .forEach((obj) => scene.remove(obj));

  resetLighting();
  scene.background = new THREE.Color(0x000000); // Dark skybox
  scene.fog = new THREE.Fog(0x000000, 0, 15);

  // Load the first hallway segment (Hallway A)
  gltfLoader.load(
    "./public/Char/infin-hallwy.glb",
    (gltf) => {
      hallwayA = gltf.scene;
      hallwayA.scale.set(1, 1, 1);
      hallwayA.position.set(0, -1, 0); // Start position
      scene.add(hallwayA);
      console.log(`✅ Hallway A loaded at Z = ${hallwayA.position.z}`);

      // Now load the second hallway (Hallway B) behind it
      gltfLoader.load(
        "./public/Char/infin-hallwy.glb",
        (gltf2) => {
          hallwayB = gltf2.scene;
          hallwayB.scale.set(1, 1, 1);
          // Position it immediately after hallway A.
          hallwayB.position.set(0, -1, -hallwayLength);
          scene.add(hallwayB);
          console.log(`✅ Hallway B loaded at Z = ${hallwayB.position.z}`);

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
        // Calculate the camera's horizontal offset relative to the current segment.
        const cameraOffsetX = camera.position.x - currentFront.position.x;
        
        // Define a local offset for the door relative to currentFront.
        // Because the hallway's forward is -Z, the back (entrance) of the segment is along +Z.
        // For example, if we want the door to appear 10 units (in world terms) from the segment's origin,
        // set doorZOffset to 10. (Adjust this value to bring the door closer or farther.)
        const doorZOffset = 1; // Try 10 (or tweak this number)
        const doorLocalOffset = new THREE.Vector3(cameraOffsetX, 0, doorZOffset);
        
        // Convert the local offset to a world position.
        const doorPos = currentFront.localToWorld(doorLocalOffset.clone());
        console.log("Computed doorPos:", doorPos);
        
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
            
            // Optionally add an AxesHelper to visualize its position:
            const helper = new THREE.AxesHelper(2);
            helper.position.copy(doorPos);
            scene.add(helper);
          },
          undefined,
          (error) => {
            console.error("❌ Error loading end door:", error);
          }
        );
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

  checkEndDoorAppearance();

  // Render using the composer
  composer.render(delta);
};
animate();
