import * as THREE from "three";

import { app, envStore } from "./stores";

export default class Physics {
    constructor() {
        import("https://cdn.skypack.dev/@dimforge/rapier3d-compat").then(
            (loadedRAPIER) => {
                loadedRAPIER.init().then(() => {
                    const { setRAPIER } = app.getState();
                    this.RAPIER = loadedRAPIER;
                    setRAPIER(loadedRAPIER);
                });
            }
        );
        const unsubSetupPhysics = app.subscribe((state) => {
            if (!state.RAPIER || !state.envLoaded) return;
            this.setup();
            unsubSetupPhysics();
        });
    }

    setup() {
        const { explodingRocks, walls, setWorld, setEventQueue } =
            envStore.getState();

        // physics
        const gravity = { x: 0.0, y: -9.81, z: 0 };

        const world = new this.RAPIER.World(gravity);
        const eventQueue = new this.RAPIER.EventQueue(true);

        setWorld(world);
        setEventQueue(eventQueue);

        // ground
        const groundColliderDesc = this.RAPIER.ColliderDesc.cuboid(
            10 / 2,
            0.5 / 2,
            10 / 2
        );
        groundColliderDesc.setTranslation(0, -0.25, 0);
        world.createCollider(groundColliderDesc);

        // walls
        for (const wall of walls) {
            let target = new THREE.Vector3();
            wall.geometry.boundingBox.getSize(target);

            const cubeColliderDesc = this.RAPIER.ColliderDesc.cuboid(
                target.x / 2,
                target.y / 2,
                target.z / 2
            );

            cubeColliderDesc.setTranslation(
                wall.position.x,
                wall.position.y,
                wall.position.z
            );
            cubeColliderDesc.setRotation(wall.quaternion);

            world.createCollider(cubeColliderDesc);
        }

        // create rigid body and collider for all exploding rocks
        for (const explodingRock of explodingRocks) {
            const explodingRockRigidBody =
                createRigidBodyForExplodingRock(explodingRock);
            explodingRock.rigidBody = explodingRockRigidBody;
        }
    }
}

export const createRigidBodyForExplodingRock = (explodingRock) => {
    const { RAPIER } = app.getState();
    const { world } = envStore.getState();

    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
        explodingRock.mesh.position.x,
        explodingRock.mesh.position.y,
        explodingRock.mesh.position.z
    );
    const explodingRockRigidBody = world.createRigidBody(rigidBodyDesc);
    const colliderDesc = RAPIER.ColliderDesc.convexHull(
        explodingRock.mesh.geometry.attributes.position.array
    )
        .setDensity(0.1)
        .setFriction(0.4)
        .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
        .setContactForceEventThreshold(1);

    world
        .createCollider(colliderDesc, explodingRockRigidBody)
        .setRestitution(0.4);

    return explodingRockRigidBody;
};
