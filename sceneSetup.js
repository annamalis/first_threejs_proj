import * as THREE from 'three';
import { EffectComposer } from 'EffectComposer';
import { RenderPass } from 'RenderPass';
import { ShaderPass } from 'ShaderPass';

export const scene = new THREE.Scene();

// Camera
export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 3;
camera.position.y = 3;

// Renderer
export const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('canvas.webgl') });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;


// Lights
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10);
light.intensity = 1.0;
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
ambientLight.intensity = 4.0;
scene.add(ambientLight);

//Post Processing Setup
export const composer = new EffectComposer(renderer);

// Render pass (renders the scene as normal)
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Pixelation shader
const PixelShader = {
    uniforms: {
        tDiffuse: { value: null }, // Input texture
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        pixelSize: { value: 8.0 }, // Pixel size
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 resolution;
        uniform float pixelSize;
        varying vec2 vUv;

        void main() {
            // Compute pixel coordinates
            vec2 dxy = pixelSize / resolution;
            vec2 coord = dxy * floor(vUv / dxy);

            

            // Sample the texture
            gl_FragColor = texture2D(tDiffuse, coord);
        }
    `,
};

// Add the pixelation pass
const pixelPass = new ShaderPass(PixelShader);
pixelPass.uniforms['resolution'].value.set(window.innerWidth, window.innerHeight);
pixelPass.uniforms['pixelSize'].value = 3.0; // Adjust pixel size for more/less pixelation
composer.addPass(pixelPass);

export const resetLighting = () => {
    console.log("🔆 Resetting lighting...");

    // ✅ Remove any existing lights before resetting
    scene.children
        .filter(obj => obj.isLight)
        .forEach(light => scene.remove(light));

    // ✅ Re-add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    ambientLight.intensity = 4.0; // Keep original intensity
    scene.add(ambientLight);

    // ✅ Re-add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    directionalLight.intensity = 1.0;
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    console.log("✅ Lighting reset complete.");
}
