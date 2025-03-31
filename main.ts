import * as THREE from 'three';
import { ShaderTuber } from './components/shader';

// Visualization setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

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
const ambientLight = new THREE.AmbientLight()
const pointLight = new THREE.PointLight()
pointLight.position.set(10, 10, 10)
scene.add(ambientLight)
scene.add(pointLight)

// init shadertuber
const audioContext = new AudioContext();
const shaderTuber = new ShaderTuber(audioContext);
scene.add(shaderTuber);

camera.position.z = 5;

function animate() {
  requestAnimationFrame(animate);
  shaderTuber.render();
  renderer.render(scene, camera);
}

animate();