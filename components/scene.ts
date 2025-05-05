import * as THREE from 'three';
import { ShaderTuber } from './shader';
import { FaceLandmarker } from '@mediapipe/tasks-vision';

// @ts-ignore
import px from '../components/textures/envmap/px.png'
// @ts-ignore
import nx from '../components/textures/envmap/nx.png'
// @ts-ignore
import py from '../components/textures/envmap/py.png'
// @ts-ignore
import ny from '../components/textures/envmap/ny.png'
// @ts-ignore
import pz from '../components/textures/envmap/pz.png'
// @ts-ignore
import nz from '../components/textures/envmap/nz.png'

export function renderScene(faceLandmarker: FaceLandmarker) {
    // Visualization setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 2;

    // renderer options
    const renderer = new THREE.WebGLRenderer({
    antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    renderer.setPixelRatio(Math.min(Math.max(1, window.devicePixelRatio), 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    //@ts-ignore: dw this works, renderer encoding options not available in @types/three
    renderer.outputEncoding = THREE.sRGBEncoding;

    // lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1)
    ambientLight.castShadow = true;
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // environment
    const textureLoader = new THREE.CubeTextureLoader();
    const bgTexture = textureLoader.load([
        px, nx, py, ny, pz, nz
    ]);
    scene.background = bgTexture;

    // init shadertuber
    const audioContext = new AudioContext();
    const shaderTuber = new ShaderTuber(audioContext, faceLandmarker, bgTexture);
    scene.add(shaderTuber);

    const animate = () => {
        requestAnimationFrame(animate);
        shaderTuber.render();
        shaderTuber.material.uniforms.time.value = performance.now() / 1000;
        renderer.render(scene, camera);
    }

    animate();
}