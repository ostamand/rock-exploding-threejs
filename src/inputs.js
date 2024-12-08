import { envStore } from "./stores";

export default class Inputs {
    constructor(camera, raycaster) {
        this.camera = camera;
        this.raycaster = raycaster;

        window.addEventListener("click", (event) => {
            this.handleClick(event.clientX, event.clientY);
        });

        window.addEventListener("touchstart", (event) => {
            const touch = event.touches[0];
            this.handleClick(touch.clientX, touch.clientY);
        });
    }
    handleClick(clientX, clientY) {
        const mouse = {
            x: (clientX / window.innerWidth) * 2 - 1,
            y: -((clientY / window.innerHeight) * 2 - 1),
        };

        this.raycaster.setFromCamera(mouse, this.camera);

        const { explodingRocks } = envStore.getState();

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

                data.rigidBody.applyImpulse(
                    {
                        x: Math.random() * 2 - 1,
                        y: Math.random() * 2 - 1,
                        z: Math.random() * 2 - 1,
                    },
                    true
                );
                uniqueIntersect.add(name);
            }
        }
    }
}
