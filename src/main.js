import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as dat from "dat.gui";

const params = {
    rockColor: { r: 51, g: 46, b: 46 },
    directionalLightColor: { r: 49, g: 148, b: 176 },
};

const gui = new dat.GUI();

const canvas = document.getElementById("root");

// loaders
const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

// scene
const scene = new THREE.Scene();

// camera
const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);
camera.position.set(10, 8, 12);

// orbit controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2; // don't go below ground

// renderer
const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x3b3b3b);

// lights
const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(
    new THREE.Color(
        params.directionalLightColor.g / 255,
        params.directionalLightColor.b / 255,
        params.directionalLightColor.r / 255
    ),
    2
);

directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 256;
directionalLight.shadow.mapSize.height = 256;
directionalLight.position.set(6.94011, 11.3524, -17.6677);
scene.add(directionalLight);

scene.add(new THREE.DirectionalLightHelper(directionalLight, 1));

// textures
const bakedTexture = textureLoader.load("/models/baked2k_v2.jpg");
bakedTexture.flipY = false;
bakedTexture.colorSpace = THREE.SRGBColorSpace;

// materials
const bakedMaterial = new THREE.MeshStandardMaterial({
    metalness: 0,
    roughness: 1,
    map: bakedTexture,
});

const rockMaterial = new THREE.MeshStandardMaterial({
    metalness: 0,
    roughness: 1,
    color: new THREE.Color(
        params.rockColor.r / 255,
        params.rockColor.g / 255,
        params.rockColor.b / 255
    ),
});

gltfLoader.load("/models/rock-exploding.glb", (loadedAsset) => {
    loadedAsset.scene.traverse((child) => {
        if (child.isMesh) {
            if (child.name.startsWith("explodingRocks")) {
                child.material = rockMaterial;
                child.castShadow = true;
            } else {
                child.material = bakedMaterial;
            }
            if (child.name.startsWith("plants")) {
                child.material.side = THREE.DoubleSide;
            }
        }
    });

    const ground = loadedAsset.scene.children.find(
        (child) => child.name === "ground"
    );

    ground.receiveShadow = true;
    //console.log(loadedAsset.scene);

    scene.add(loadedAsset.scene);
});

// debug

gui.addColor(params, "rockColor").onChange((value) => {
    rockMaterial.color = new THREE.Color(
        value.r / 255,
        value.g / 255,
        value.b / 255
    );
});

gui.addColor(params, "directionalLightColor").onChange((value) => {
    directionalLight.color = new THREE.Color(
        value.r / 255,
        value.g / 255,
        value.b / 255
    );
});

// physics
import("@dimforge/rapier3d").then((RAPIER) => {
    const gravity = { x: 0.0, y: -9.81, z: 0 };
    const world = new RAPIER.World(gravity);

    // RAPIER.ColliderDesc.cuboid()
});

// loop

const clock = new THREE.Clock();
let lastElapsedTime = 0;
const loop = () => {
    // delta time
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - lastElapsedTime;
    lastElapsedTime = elapsedTime;

    renderer.render(scene, camera);
    controls.update(deltaTime);
    window.requestAnimationFrame(loop);
};

loop();
