import * as THREE from 'three';
import { scene } from './sceneSetup.js';

export const addEnvironment = () => {
    // Skybox
    const loader = new THREE.CubeTextureLoader();
    const skyboxTexture = loader.load([
        '/skybox_px.jpg', '/skybox_nx.jpg',
        '/skybox_nz.jpg', '/skybox_pz.jpg',
        '/skybox_py.jpg', '/skybox_ny.jpg'
    ]);
    scene.background = skyboxTexture;

    // Ground Plane
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x556b2f });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -1, 0);
    ground.receiveShadow = true;
    scene.add(ground);
};