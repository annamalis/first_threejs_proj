import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { scene } from './sceneSetup.js';

export const loadModel = (path, scale = 1) => {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(
            path,
            (gltf) => {
                const model = gltf.scene;
                model.scale.set(scale, scale, scale);
                scene.add(model);

                const boundingBox = new THREE.Box3().setFromObject(model);
                resolve({ model, boundingBox });
            },
            undefined,
            (error) => {
                reject(error);
            }
        );
    });
};