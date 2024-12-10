import { createStore } from "zustand/vanilla";
import { Howl } from "howler";

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

export const soundStore = createStore((set, get) => ({
    rockCollisionSounds: [],
    ambientSound: null,
    playRandomSound: () => {
        const { rockCollisionSounds } = get();
        const randomSound =
            rockCollisionSounds[
                Math.floor(Math.random() * rockCollisionSounds.length)
            ];
        const volume = Math.random() * 0.5 + 0.25;
        randomSound.stop();
        randomSound.volume(volume);
        randomSound.play();
    },
    playAmbient: () => {
        const { ambientSound } = get();
        //ambientSound.stop();
        ambientSound.play();
    },
    setRockCollisionSounds: (sounds) => {
        const rockCollisionSounds = [];
        for (const sound of sounds) {
            rockCollisionSounds.push(new Howl({ src: [sound] }));
        }
        set({ rockCollisionSounds });
    },
    setAmbientSound: (sound) => {
        const ambientSound = new Howl({ src: [sound] });
        set({ ambientSound });
    },
}));
