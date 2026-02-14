import * as THREE from "../node_modules/three/build/three.module.js";
import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { AsciiEffect } from "three/addons/effects/AsciiEffect.js";

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.style.background = "black";

// ---- Layers
const LAYER_GROUND = 0;
const LAYER_TREES = 1;

// ---- Scene / Camera / Renderer
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

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.display = "none"; // hide WebGL canvas
document.body.appendChild(renderer.domElement);

// ---- Ground (Layer 0)
const planeGeometry = new THREE.PlaneGeometry(30, 30);
const ground = new THREE.Mesh(
  planeGeometry,
  new THREE.MeshLambertMaterial({ color: 0x6b4f2a })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
ground.layers.set(LAYER_GROUND);
scene.add(ground);

// ---- Lights (apply to all layers)
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(5, 10, 5);
scene.add(sun);

const ambient = new THREE.AmbientLight(0xffffff, 0.25);
scene.add(ambient);

// ---- Trees (Layer 1)
loader.load("/Models/pineTree.glb", (gltf) => {
  const root = gltf.scene;
  root.scale.set(0.1, 0.1, 0.1);
  root.position.set(0, 0, 0);

  root.traverse((obj) => {
    obj.layers.set(LAYER_TREES);
    if (obj.isMesh) {
      // simpler material = cleaner ASCII contrast
      obj.material = new THREE.MeshLambertMaterial({ color: 0x2f6b2f });
    }
  });

  scene.add(root);
});

// ---- Two offscreen AsciiEffects (NOT appended)
const groundEffect = new AsciiEffect(renderer, " .:-=+*#%@", { invert: false });
const treeEffect = new AsciiEffect(renderer, " ░▒▓█", { invert: false });

// ---- One visible output (final composited screen)
const out = document.createElement("pre");
out.style.position = "absolute";
out.style.inset = "0";
out.style.margin = "0";
out.style.padding = "0";
out.style.background = "black";
out.style.color = "white";
out.style.fontFamily = "monospace";
out.style.whiteSpace = "pre";
out.style.lineHeight = "1";
out.style.userSelect = "none";
out.style.pointerEvents = "auto";
document.body.appendChild(out);

// ---- Optional: tint via CSS classes (run-based, not per-char spans)
const style = document.createElement("style");
style.textContent = `
  .g { color: #b07a3a; }   /* ground brown */
  .t { color: #60ff60; }   /* tree green  */
`;
document.head.appendChild(style);

// ---- Controls on the ONE visible element
const controls = new OrbitControls(camera, out);
controls.target.set(0, 1, 0);
controls.update();

// ---- Helpers
function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// Build HTML with spans per RUN (fast enough), not per character
function compositeToHtml(groundText, treeText) {
  const gLines = groundText.split("\n");
  const tLines = treeText.split("\n");
  const h = Math.max(gLines.length, tLines.length);

  // Find width so we can pad and keep alignment
  let w = 0;
  for (let i = 0; i < h; i++) {
    w = Math.max(w, (gLines[i] ?? "").length, (tLines[i] ?? "").length);
  }

  let html = "";

  for (let y = 0; y < h; y++) {
    const g = (gLines[y] ?? "").padEnd(w, " ");
    const t = (tLines[y] ?? "").padEnd(w, " ");

    let runType = null; // 'g' or 't'
    let run = "";

    for (let x = 0; x < w; x++) {
      const tc = t[x];
      const gc = g[x];

      const isTree = tc !== " " && tc !== undefined;
      const type = isTree ? "t" : "g";
      const ch = isTree ? tc : gc;

      if (type !== runType) {
        if (runType !== null) {
          html += `<span class="${runType}">${escapeHtml(run)}</span>`;
        }
        runType = type;
        run = ch;
      } else {
        run += ch;
      }
    }

    if (runType !== null) {
      html += `<span class="${runType}">${escapeHtml(run)}</span>`;
    }

    if (y < h - 1) html += "\n";
  }

  return html;
}

// ---- Render loop
const SCALE = 1.0; // try 0.75 or 0.5 if you want more FPS

function setAsciiSize() {
  const w = Math.floor(window.innerWidth * SCALE);
  const h = Math.floor(window.innerHeight * SCALE);
  groundEffect.setSize(w, h);
  treeEffect.setSize(w, h);

  // keep output element full size
  out.style.fontSize = "12px"; // adjust as you like
}

setAsciiSize();

function animate() {
  // 1) render ground into its internal DOM
  camera.layers.set(LAYER_GROUND);
  groundEffect.render(scene, camera);

  // 2) render trees into its internal DOM
  camera.layers.set(LAYER_TREES);
  treeEffect.render(scene, camera);

  // 3) composite into ONE screen:
  //    tree chars replace ground chars = no overlay
  const gText = groundEffect.domElement.textContent ?? "";
  const tText = treeEffect.domElement.textContent ?? "";
  out.innerHTML = compositeToHtml(gText, tText);
}

renderer.setAnimationLoop(animate);

// ---- Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  setAsciiSize();
});


