import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as dat from "dat.gui";
import { app, envStore } from "./stores.js";
import Physics from "./physics.js";
import Inputs from "./inputs.js";

new Physics();

const params = {
    rockColor: { r: 6, g: 4, b: 4 },
    directionalLightColor: { r: 55, g: 61, b: 156 },
};

const gui = new dat.GUI();
gui.hide();

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

// inputs

const raycaster = new THREE.Raycaster();
new Inputs(camera, raycaster);

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
const ambientLight = new THREE.AmbientLight(0xffffff, 4);
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

// textures
const bakedTexture = textureLoader.load("models/baked4k.jpg");
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

// load model
gltfLoader.load("models/rock-exploding.glb", (loadedAsset) => {
    const explodingRocks = [];
    const walls = [];

    loadedAsset.scene.traverse((child) => {
        if (child.isMesh) {
            if (child.name.startsWith("explodingRocks")) {
                explodingRocks.push({
                    mesh: child,
                });
                child.material = rockMaterial;
                child.material.side = THREE.DoubleSide;
                child.castShadow = true;
            } else {
                child.material = bakedMaterial;
            }

            if (child.name.startsWith("plants")) {
                child.material.side = THREE.DoubleSide;
            }
            if (child.name.startsWith("wall")) {
                //child.visible = false;
                walls.push(child);
            }
        }
    });

    const ground = loadedAsset.scene.children.find(
        (child) => child.name === "ground"
    );

    ground.receiveShadow = true;

    scene.add(loadedAsset.scene);

    const { setEnvLoaded } = app.getState();
    const { setExplodingRocks, setWalls } = envStore.getState();
    setExplodingRocks(explodingRocks);
    setWalls(walls);
    setEnvLoaded();
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

// developement stuff

const testMaterial = new THREE.MeshBasicMaterial({
    wireframe: true,
    color: "white",
});

const groundGeometry = new THREE.BoxGeometry(10, 0.5, 10);
const groundMesh = new THREE.Mesh(groundGeometry, testMaterial);
groundMesh.position.set(0, -0.25, 0);
scene.add(groundMesh);

groundMesh.visible = false;

// loop

const clock = new THREE.Clock();
let lastElapsedTime = 0;
const loop = () => {
    // delta time
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - lastElapsedTime;
    lastElapsedTime = elapsedTime;

    const { world, explodingRocks } = envStore.getState();

    world.timestep = Math.min(deltaTime, 0.1);
    world.step();

    for (const explodingRock of explodingRocks) {
        explodingRock.mesh.position.copy(explodingRock.rigidBody.translation());
        explodingRock.mesh.quaternion.copy(explodingRock.rigidBody.rotation());
    }

    renderer.render(scene, camera);
    controls.update(deltaTime);
    window.requestAnimationFrame(loop);
};

const unsubStartLoop = app.subscribe((state) => {
    if (state.RAPIER && state.envLoaded) {
        loop();
        unsubStartLoop();
    }
});
