import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { scene } from "./sceneSetup.js";
import { collisionManager } from "./collisionManager.js";

export const addEnvironment = () => {
  // Skybox
  const loader = new THREE.CubeTextureLoader();
  const skyboxTexture = loader.load([
    "/skybox_px.jpg",
    "/skybox_nx.jpg",
    "/skybox_nz.jpg",
    "/skybox_pz.jpg",
    "/skybox_py.jpg",
    "/skybox_ny.jpg",
  ]);
  scene.background = skyboxTexture;

  // Ground Plane
  const groundGeometry = new THREE.PlaneGeometry(500, 500);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x556b2f });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -1.01, 0);
  ground.receiveShadow = true;
  scene.add(ground);



// Load Environment
  const gltfLoader = new GLTFLoader();
  gltfLoader.load(
    "./public/Char/environ-01-yard-kitchen-test4.glb",
    (gltf) => {
      const environment = gltf.scene;
      environment.scale.set(1, 1, 1); // Adjust scale if needed
      environment.position.set(0, -1, 0);
      scene.add(environment);

      // Set up collisions for walls
      environment.traverse((child) => {
        if (child.isMesh && child.name.toLowerCase().includes("wall")) {
          const boundingBox = new THREE.Box3().setFromObject(child);
          collisionManager.addModel(child, boundingBox);
        
          //debugging collisions
          /*
          const helper = new THREE.Box3Helper(boundingBox, 0xff0000); 
          scene.add(helper);
          */
        }

        if (child.isMesh && child.name.startsWith('collision_')) {
            const boundingBox = new THREE.Box3().setFromObject(child);
            collisionManager.addModel(child, boundingBox);
            child.material.visible = false;
        }
      });

      console.log("Environment loaded with collisions.");
    },
    undefined,
    (error) => {
      console.error("Error loading environment:", error);
    }
  );

  
};
