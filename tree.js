import * as THREE from "../node_modules/three/build/three.module.js";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export class Tree {

    constructor(x, y, z, gltf, scene, scalar) {

        //clone
        const clonedScene = SkeletonUtils.clone(gltf.scene);
        this.root = new THREE.Object3D();
        this.root.add(clonedScene);
        this.root.scale.set(scalar, scalar, scalar);
        this.root.position.x = x;
        this.root.position.z = z;
        this.root.position.y = y;

        // Add to the scene
        scene.add(this.root);

        //add box for collisions
        const trunkRadius = 0.25;
        const height = 10;

        this.box = new THREE.Box3(
        new THREE.Vector3(x - trunkRadius * scalar, y, z - trunkRadius * scalar),
        new THREE.Vector3(x + trunkRadius * scalar, y + height, z + trunkRadius * scalar)
        );
    }

    getBox() {
        return this.box;
    }
}
