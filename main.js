import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { AsciiEffect } from "three/addons/effects/AsciiEffect.js";
import { Tree } from "./tree.js";

alert("Use WASD to move, and the left/right arrow keys to pan the camera");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.display = 'none';
document.body.appendChild(renderer.domElement);

let colors = false;
const velocity = new THREE.Vector3();
const ACCELERATION = 25;
const MAX_SPEED = 6; 
const SLOWDOWN = 10;
const PAN_SPEED = 1;
const CHUNK_SIZE = 100;
const TREES_PER_CHUNK = 200;
const loader = new GLTFLoader();
const playerBox = new THREE.Box3();
const halfSize = new THREE.Vector3(0.5, 1.6, 0.5);
const colliders = [];

loader.load("/Models/pineTree.glb", (gltf) => {
    init(gltf);
});   

function init(treeGLTF) {

    for (let i = 0; i < TREES_PER_CHUNK; i++) {
        let scalar = Math.random() * (1/5) + 1/5;
        let tree = new Tree((Math.random() < 0.5 ? -1 : 1) * Math.random() * CHUNK_SIZE / 2, -1, (Math.random() < 0.5 ? -1 : 1) * Math.random() * CHUNK_SIZE / 2, treeGLTF ,scene, scalar );
        colliders.push(tree.getBox());
    }
}

function updatePlayerBox() {
    const center = camera.position;

    playerBox.min.copy(center).sub(halfSize);
    playerBox.max.copy(center).add(halfSize);
}

function isColliding(playerBox, colliders) {
    for (const box of colliders) {
        if (playerBox.intersectsBox(box)) {
            return true;
        }
    }
    return false;
}

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Update camera
  camera.aspect = width / height;

  // Update effect
  effect.setSize(width, height);
  effect.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

window.addEventListener('resize', onWindowResize);

// Ground
const planeGeometry = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE);
const ground = new THREE.Mesh(
  planeGeometry,
  new THREE.MeshPhongMaterial({ color: 0xa0adaf, shininess: 10 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1;
scene.add(ground);

// Lights
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);

scene.add(new THREE.AmbientLight(0xffffff, 0.3));

let effect = new AsciiEffect(renderer, ' .:-+*=%@#', { invert: true});
effect.setSize(window.innerWidth, window.innerHeight);
effect.domElement.style.color = 'white';
effect.domElement.style.backgroundColor = 'black';

document.body.appendChild(effect.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();

//Keys events
const keys = {};

window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
});

window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
});

let lastTime = performance.now();
const previousPosition = new THREE.Vector3();

    let red = 100;
    let green = 100;
    let blue = 100;

// Animation
function animate(time) {
    effect.render(scene, camera);

    //colors ^-^
    if(colors) {
        red = ((red + (Math.random() < 0.5 ? -1 : 1) * Math.random() * 5));
        blue = ((blue + (Math.random() < 0.5 ? -1 : 1) * Math.random() * 5));
        green = ((green + (Math.random() < 0.5 ? -1 : 1) * Math.random() * 5));
        effect.domElement.style.color = `rgb(${red}, ${green}, ${blue})`;

        if ((red + blue + green) < 300) {
            red += 10;
            blue += 10;
            green += 10;
        }
    }

    //Save current camera position
    previousPosition.copy(camera.position);
    updatePlayerBox();

    //Camera movement
    const delta = (time - lastTime) / 1000;
    lastTime = time;

    if (keys["ArrowLeft"]) {
        camera.rotation.y += PAN_SPEED * delta;
    }
    if (keys["ArrowRight"]) {
        camera.rotation.y -= PAN_SPEED * delta;
    }

    // Move to where camera points
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3()
        .crossVectors(forward, camera.up)
        .normalize();

    const moveDir = new THREE.Vector3();

    if (keys["KeyW"]) moveDir.add(forward);
    if (keys["KeyS"]) moveDir.sub(forward);
    if (keys["KeyD"]) moveDir.add(right);
    if (keys["KeyA"]) moveDir.sub(right);

    // Apply acceleration
    if (moveDir.length() > 0) {
        moveDir.normalize();
        velocity.addScaledVector(moveDir, ACCELERATION * delta);
        velocity.clampLength(0, MAX_SPEED);
    } else {
        // Smooth stop
        velocity.multiplyScalar(1 - SLOWDOWN * delta);
    }

    camera.position.addScaledVector(velocity, delta);

    updatePlayerBox();

    // collision test
    if (isColliding(playerBox, colliders)) {
        camera.position.copy(previousPosition);
        velocity.set(0, 0, 0);
    }
}
renderer.setAnimationLoop(animate);
