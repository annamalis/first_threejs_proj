import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Canvas
const canvas = document.querySelector('canvas.webgl')


// Scene
const scene = new THREE.Scene()

// Objects
const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshBasicMaterial({color: 0xff0000})
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

// Sizes
const sizes = {
    width: 800,
    height: 600
}

// Camera 
const camera = new THREE.PerspectiveCamera(75, sizes.width/sizes.height)
camera.position.z = 3
scene.add(camera)

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)

renderer.render(scene, camera)

// Keyboard Input
const moveSpeed = 0.1; // Speed of camera movement
document.addEventListener('keydown', (event) => {
    switch(event.key) {
        case 'ArrowUp':    // Move camera forward
            camera.position.z -= moveSpeed;
            break;
        case 'ArrowDown':  // Move camera backward
            camera.position.z += moveSpeed;
            break;
        case 'ArrowLeft':  // Move camera left
            camera.position.x -= moveSpeed;
            break;
        case 'ArrowRight': // Move camera right
            camera.position.x += moveSpeed;
            break;
    }
})

// Animation Loop
const animate = () => {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
}
animate()