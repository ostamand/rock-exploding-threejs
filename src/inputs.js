import { envStore, app } from "./stores";
import { createRigidBodyForExplodingRock } from "./physics";
import * as THREE from "three";

export default class Inputs {
    constructor(camera, raycaster) {
        this.camera = camera;
        this.raycaster = raycaster;

        window.addEventListener("resize", () => {
            const { renderer, camera } = envStore.getState();

            const width = window.innerWidth;
            const height = window.innerHeight;

            // update camera
            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            // update renderer
            const pixelRatio = Math.min(window.devicePixelRatio, 2);
            renderer.setSize(width, height);
            renderer.setPixelRatio(pixelRatio);
        });

        window.addEventListener("click", (event) => {
            this.handleClickExplodingRock(event.clientX, event.clientY);
        });

        window.addEventListener("touchstart", (event) => {
            const touch = event.touches[0];
            this.handleClickExplodingRock(touch.clientX, touch.clientY);
        });

        document
            .querySelector(".start-btn")
            .addEventListener("click", (event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                this.handleClickStartBtn();
            });

        document
            .querySelector(".reset-btn")
            .addEventListener("click", (event) => {
                event.preventDefault();
                this.handleClickResetBtn();
            });
    }

    handleClickResetBtn() {
        const { explodingRocks, world } = envStore.getState();
        app.setState({ playing: false });
        for (const explodingRock of explodingRocks) {
            // remove rigid body
            world.removeRigidBody(explodingRock.rigidBody);
            explodingRock.rigidBody = null;

            explodingRock.mesh.position.copy(explodingRock.originalPosition);
            explodingRock.mesh.rotation.copy(explodingRock.originalRotation);

            const explodingRockRigidBody =
                createRigidBodyForExplodingRock(explodingRock);

            explodingRock.rigidBody = explodingRockRigidBody;
        }
        window.setTimeout(() => {
            app.setState({ playing: true });
        }, 250);
    }

    handleClickStartBtn() {
        const { setPlaying } = app.getState();

        const overlay = document.querySelector(".overlay");
        overlay.classList.remove("active");

        document.querySelector(".reset-btn").classList.add("active");

        window.setTimeout(() => {
            overlay.remove();
            setPlaying();
        }, 1000);
    }

    handleClickExplodingRock(clientX, clientY) {
        const { playing } = app.getState();
        if (!playing) return;

        const { explodingRocks } = envStore.getState();

        const mouse = {
            x: (clientX / window.innerWidth) * 2 - 1,
            y: -((clientY / window.innerHeight) * 2 - 1),
        };

        this.raycaster.setFromCamera(mouse, this.camera);

        const bodies = explodingRocks.map((data) => data.mesh);
        const intersects = this.raycaster.intersectObjects(bodies);

        const uniqueIntersect = new Set();
        for (const intersect of intersects) {
            const name = intersect.object.name;
            if (!uniqueIntersect.has(name)) {
                // apply impulse
                const data = explodingRocks.find(
                    (data) => data.mesh.name === name
                );

                const randomDirection = new THREE.Vector3(
                    Math.random() * 2 - 1,
                    Math.random() * 2 - 1,
                    Math.random() * 2 - 1
                ).normalize();

                const randomMagnitude = Math.random() * 3 + 0.5;

                const randomImpulse = randomDirection.multiply(
                    new THREE.Vector3(
                        randomMagnitude,
                        randomMagnitude,
                        randomMagnitude
                    )
                );

                data.rigidBody.applyImpulse(randomImpulse, true);
                uniqueIntersect.add(name);
            }
        }
    }
}
