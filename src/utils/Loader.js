import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const loader = new GLTFLoader();

export const loadModel = (path) => {
    return new Promise((resolve, reject) => {
        loader.load(
            path,
            (gltf) => resolve(gltf),
            undefined,
            (error) => reject(error)
        );
    });
};