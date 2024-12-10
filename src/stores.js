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
    playSound: true,
    explosionCount: 1,
    rockCollisionSounds: [],
    explosionSound: null,
    ambientSound: null,
    resetSound: null,
    playRandomSound: () => {
        const { rockCollisionSounds, playSound } = get();
        if (!playSound) return;
        const randomSound =
            rockCollisionSounds[
                Math.floor(Math.random() * rockCollisionSounds.length)
            ];
        const volume = Math.random() * 0.5 + 0.25;
        randomSound.stop();
        randomSound.volume(volume);
        randomSound.play();
    },
    playResetSound: () => {
        const { resetSound } = get();
        if (resetSound) {
            resetSound.play();
            setTimeout(() => {
                resetSound.stop();
            }, 500);
        }
    },
    playExplosionSound: () => {
        const { explosionSound, explosionCount } = get();
        if (explosionCount > 0) {
            explosionSound?.play();
            set({ explosionCount: explosionCount - 1 });
        }
    },
    playAmbient: () => {
        const { ambientSound } = get();
        ambientSound?.play();
    },
    setRockCollisionSounds: (sounds) => {
        const rockCollisionSounds = [];
        for (const sound of sounds) {
            rockCollisionSounds.push(new Howl({ src: [sound] }));
        }
        set({ rockCollisionSounds });
    },
    setAmbientSound: (sound) => {
        const ambientSound = new Howl({ src: [sound], volume: 2 });
        set({ ambientSound });
    },
    setExplosionSound: (sound) => {
        const explosionSound = new Howl({ src: [sound], volume: 0.1 });
        set({ explosionSound });
    },
    setPlaySound: (playSound) => {
        const { ambientSound, explosionSound } = get();
        if (!playSound) {
            ambientSound?.stop();
            explosionSound?.stop();
        } else {
            ambientSound?.play();
        }
        set({ playSound });
    },
    setResetSound: (sound) => {
        const resetSound = new Howl({ src: [sound], volume: 0.5 });
        set({ resetSound });
    },
}));
