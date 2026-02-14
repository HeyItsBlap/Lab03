import * as THREE from "../node_modules/three/build/three.module.js";
import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { AsciiEffect } from "three/addons/effects/AsciiEffect.js";

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.style.background = "black";

// Layers
const LAYER_GROUND = 0;
const LAYER_TREES = 1;

//Scene / Camera / Renderer
const loader = new GLTFLoader();
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 6);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.display = "none"; // hide WebGL canvas, we only want ASCII
document.body.appendChild(renderer.domElement);

// Ground
const planeGeometry = new THREE.PlaneGeometry(30, 30);
const ground = new THREE.Mesh(
  planeGeometry,
  new THREE.MeshLambertMaterial({ color: 0x6b4f2a })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
ground.layers.set(LAYER_GROUND);
scene.add(ground);

// Lights
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(5, 10, 5);
sun.layers.enable(LAYER_GROUND);
sun.layers.enable(LAYER_TREES);
scene.add(sun);

const ambient = new THREE.AmbientLight(0xffffff, 0.25);
ambient.layers.enable(LAYER_GROUND);
ambient.layers.enable(LAYER_TREES);
scene.add(ambient);

// Trees (Layer 1)
const url = "/Models/pineTree.glb";
loader.load(url, (gltf) => {
  const root = gltf.scene;
  root.scale.set(0.1, 0.1, 0.1);
  root.position.set(0, 0, 0);

  root.traverse((obj) => {
    obj.layers.set(LAYER_TREES);
  });

  scene.add(root);
});

// ---- Helper to style ASCII DOM layers
function styleAsciiLayer(dom, { color, background, zIndex, interactive }) {
  dom.style.position = "absolute";
  dom.style.top = "0";
  dom.style.left = "0";
  dom.style.right = "0";
  dom.style.bottom = "0";
  dom.style.color = color;
  dom.style.backgroundColor = background; // keep bottom layer black, top transparent
  dom.style.zIndex = String(zIndex);
  dom.style.pointerEvents = interactive ? "auto" : "none";
}

// ---- Two ASCII passes (one per group)
const groundEffect = new AsciiEffect(renderer, " .:-=+*#%@", { invert: true });
groundEffect.setSize(window.innerWidth, window.innerHeight);
styleAsciiLayer(groundEffect.domElement, {
  color: "#b07a3a",       // "brown"
  background: "black",    // bottom layer paints background
  zIndex: 0,
  interactive: false,
});
document.body.appendChild(groundEffect.domElement);

const treeEffect = new AsciiEffect(renderer, " ░▒▓███", { invert: true });
treeEffect.setSize(window.innerWidth, window.innerHeight);
styleAsciiLayer(treeEffect.domElement, {
  color: "#60ff60",       // "green"
  background: "transparent", // top layer must be transparent
  zIndex: 1,
  interactive: true,      // controls go here
});
document.body.appendChild(treeEffect.domElement);

// ---- Controls on TOP layer
const controls = new OrbitControls(camera, treeEffect.domElement);
controls.target.set(0, 1, 0);
controls.update();

// ---- Render loop: render each layer separately
function animate() {
  // Pass 1: ground only
  camera.layers.set(LAYER_GROUND);
  groundEffect.render(scene, camera);

  // Pass 2: trees only
  camera.layers.set(LAYER_TREES);
  treeEffect.render(scene, camera);
}
renderer.setAnimationLoop(animate);

// ---- Resize handling
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  groundEffect.setSize(window.innerWidth, window.innerHeight);
  treeEffect.setSize(window.innerWidth, window.innerHeight);
});

