import { createStore } from "zustand/vanilla";

export const app = createStore((set) => ({
    envLoaded: false,
    playing: false,
    RAPIER: null,
    setEnvLoaded: () => set({ envLoaded: true }),
    setRAPIER: (RAPIER) => set({ RAPIER }),
    setPlaying: () => set({ playing: true }),
}));

export const envStore = createStore((set) => ({
    explodingRocksHandles: [],
    explodingRocks: [],
    walls: [],
    world: null,
    eventQueue: null,
    renderer: null,
    camera: null,
    setExplodingRocks: (explodingRocks) => set({ explodingRocks }),
    setWalls: (walls) => set({ walls }),
    setWorld: (world) => set({ world }),
    setCamera: (camera) => set({ camera }),
    setRenderer: (renderer) => set({ renderer }),
    setEventQueue: (eventQueue) => set({ eventQueue }),
}));

export const soundStore = createStore((set) => ({
    rockCollions: [],
}));
