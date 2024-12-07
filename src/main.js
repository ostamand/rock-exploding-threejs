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
const bakedTexture = textureLoader.load("/models/baked4k.jpg");
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

let explodingRocks = [];
let walls = [];
gltfLoader.load("/models/rock-exploding.glb", (loadedAsset) => {
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
                child.visible = false;
                walls.push(child);
            }
        }
    });

    const ground = loadedAsset.scene.children.find(
        (child) => child.name === "ground"
    );

    ground.receiveShadow = true;

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
let world = null;
import("@dimforge/rapier3d").then((RAPIER) => {
    const gravity = { x: 0.0, y: -9.81, z: 0 };
    world = new RAPIER.World(gravity);

    // ground
    const groundColliderDesc = RAPIER.ColliderDesc.cuboid(
        10 / 2,
        0.5 / 2,
        10 / 2
    );
    groundColliderDesc.setTranslation(0, -0.25, 0);
    world.createCollider(groundColliderDesc);

    // walls
    for (const wall of walls) {
        const wallSize = {
            sizeX: Math.abs(
                wall.geometry.boundingBox.max.x -
                    wall.geometry.boundingBox.min.x
            ),
            sizeY: Math.abs(
                wall.geometry.boundingBox.max.y -
                    wall.geometry.boundingBox.min.y
            ),
            sizeZ: Math.abs(
                wall.geometry.boundingBox.max.z -
                    wall.geometry.boundingBox.min.z
            ),
        };

        // console.log(wall.geometry.attributes.position.array.min);

        const cubeColliderDesc = RAPIER.ColliderDesc.cuboid(
            wallSize.sizeX / 2,
            wallSize.sizeY / 2,
            wallSize.sizeZ / 2
        );

        cubeColliderDesc.setTranslation(
            wall.position.x,
            wall.position.y,
            wall.position.z
        );

        const testGeometry = new THREE.BoxGeometry(
            wallSize.x,
            wallSize.y,
            wallSize.z
        );

        console.log(wallSize);

        const testMesh = new THREE.Mesh(testGeometry, testMaterial);
        testMesh.position.copy(wall.position);
        testMesh.quaternion.copy(wall.quaternion);

        scene.add(testMesh);

        world.createCollider(cubeColliderDesc);
    }

    // create rigid body and collider for all exploding rocks
    for (const explodingRock of explodingRocks) {
        const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
            explodingRock.mesh.position.x,
            explodingRock.mesh.position.y,
            explodingRock.mesh.position.z
        );
        const explodingRockRigidBody = world.createRigidBody(rigidBodyDesc);
        const colliderDesc = RAPIER.ColliderDesc.convexHull(
            explodingRock.mesh.geometry.attributes.position.array
        );

        world
            .createCollider(colliderDesc, explodingRockRigidBody)
            .setRestitution(0.7);

        explodingRock.rigidBody = explodingRockRigidBody;
    }
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

let appliedForce = false;
const loop = () => {
    // delta time
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - lastElapsedTime;
    lastElapsedTime = elapsedTime;

    if (world) {
        world.step();

        for (const explodingRock of explodingRocks) {
            explodingRock.mesh.position.copy(
                explodingRock.rigidBody.translation()
            );
            explodingRock.mesh.quaternion.copy(
                explodingRock.rigidBody.rotation()
            );
        }

        if (!appliedForce) {
            for (const explodingRock of explodingRocks) {
                explodingRock.rigidBody.applyImpulse(
                    {
                        x: Math.random() * 10 - 5,
                        y: Math.random() * 20.0 - 10.0,
                        z: Math.random() * 10 - 5,
                    },
                    true
                );
            }
            appliedForce = true;
        }
    }

    renderer.render(scene, camera);
    controls.update(deltaTime);
    window.requestAnimationFrame(loop);
};

loop();
