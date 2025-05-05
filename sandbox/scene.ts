import * as THREE from 'three';
import { GLTFLoader, OrbitControls, RoomEnvironment } from 'three/examples/jsm/Addons.js';

// @ts-ignore
import vertexShader from '../components/shaders/vertex.glsl'
// @ts-ignore
import fragmentShader from '../components/shaders/fragment.glsl'
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
// @ts-ignore
import tvUrl from '../components/3d/scene.glb'

export function renderScene() {
    // Visualization setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 1;

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

    // environment
    const textureLoader = new THREE.CubeTextureLoader();
    const bgTexture = textureLoader.load([
        px, nx, py, ny, pz, nz
    ]);
    scene.background = bgTexture;

    const controls = new OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true;
    controls.minDistance = 1;
    controls.maxDistance = 10;
    controls.target.set( 0, 0.35, 0 );
    controls.update();

    // lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1)
    ambientLight.castShadow = true;
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight();
    directionalLight.position.set(5,5,5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    let model: THREE.Object3D;

    const loader = new GLTFLoader();
    loader.load(
        tvUrl,
        function (gltf) {
            console.log(gltf);

            gltf.scene.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }

                if (child.name === "CRT_Monitor") {
                    model = child;
                    model.scale.set(5,5,5);
                    model.position.setX(0);
                    model.position.setY(32);
                    model.position.setZ(0);
                }
            })

            scene.add(gltf.scene);
        },
        undefined,
        function (error) {
            console.error(error);
        }
    );

    // init obj
    const geometry = new THREE.IcosahedronGeometry(2, 10);
    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            waveSpeed: { value: 0.2 },
            waveScale: { value: 0.5 },
            distortionScale: { value: 1 },
            envMap: { value: bgTexture },
            opacity: { value: 1.0 },
            reflectivity: { value: 0.1 },
            refractiveIndex: { value: 1.0 },
            baseColor: { value: [0.0, 1.0, 0.0] },
            baseColorIntensity: { value: 1.0 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    });
    material.transparent = true;
    // material.wireframe = true;
    const cube = new THREE.Mesh( geometry, material );
    // scene.add(cube);


    const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        material.uniforms.time.value = performance.now() / 1000;
        model.rotation.x = model.rotation.y += 0.01;
        renderer.render(scene, camera);
    }

    animate();
}