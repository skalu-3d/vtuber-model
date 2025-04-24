import * as THREE from 'three';
import { ShaderTuber } from './shader';
import { FaceLandmarker } from '@mediapipe/tasks-vision';

//@ts-ignore import texture from local dir
import imgUrl from './textures/texture.gif';

export function renderScene(faceLandmarker: FaceLandmarker) {
    // Visualization setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);

    const renderer = new THREE.WebGLRenderer({
    antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // renderer options
    renderer.setPixelRatio(Math.min(Math.max(1, window.devicePixelRatio), 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    //@ts-ignore: dw this works, renderer encoding options not available in @types/three
    renderer.outputEncoding = THREE.sRGBEncoding;

    // lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1)
    // const pointLight = new THREE.PointLight(0xffffff, 2)
    // pointLight.position.set(7, 9, 10)
    // pointLight.castShadow = true;
    ambientLight.castShadow = true;
    scene.add(ambientLight)
    // scene.add(pointLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // init shadertuber
    const audioContext = new AudioContext();
    const shaderTuber = new ShaderTuber(audioContext, faceLandmarker);
    scene.add(shaderTuber);

    camera.position.z = 2;


    const animate = () => {
        requestAnimationFrame(animate);
        shaderTuber.render();
        renderer.render(scene, camera);
    }

    animate();
}