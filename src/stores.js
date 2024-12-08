import { createStore } from "zustand/vanilla";

export const app = createStore((set) => ({
    envLoaded: false,
    RAPIER: null,
    setEnvLoaded: () => set({ envLoaded: true }),
    setRAPIER: (RAPIER) => set({ RAPIER }),
}));

export const envStore = createStore((set) => ({
    explodingRocks: [],
    walls: [],
    world: null,
    setExplodingRocks: (explodingRocks) => set({ explodingRocks }),
    setWalls: (walls) => set({ walls }),
    setWorld: (world) => set({ world }),
}));
