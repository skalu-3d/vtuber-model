import * as THREE from 'three';
import { GLTFLoader, OrbitControls, RoomEnvironment } from 'three/examples/jsm/Addons.js';
import { BONES } from '../components/3d/wobot/bones';
import { RenderPass } from 'three/examples/jsm/Addons.js';
import { EffectComposer } from 'three/examples/jsm/Addons.js';
import { UnrealBloomPass } from 'three/examples/jsm/Addons.js';

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
    const cubeTextureLoader = new THREE.CubeTextureLoader();
    const bgTexture = cubeTextureLoader.load([
        px, nx, py, ny, pz, nz
    ]);
    // scene.background = bgTexture;
    renderer.setClearColor(THREE.Color.NAMES.darkblue);

    const controls = new OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true;
    controls.minDistance = 1;
    controls.maxDistance = 10;
    controls.target.set( 0, 0.35, 0 );
    controls.update();

    // lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 10)
    ambientLight.castShadow = true;
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight();
    directionalLight.position.set(5,5,5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    let model: THREE.Object3D;
    let modelUrl = new URL('../components/3d/wobot/wobot-fixed.glb', import.meta.url).href;
    let textureLoader = new THREE.TextureLoader();
    let faceUrl = new URL('../components/textures/v1_face_proto.png', import.meta.url).href;
    let faceTexture = textureLoader.load(faceUrl);
    console.log(modelUrl);

    console.log("loading model...");
    const loader = new GLTFLoader();
    loader.load(
        modelUrl,
        function (gltf) {
            console.log(gltf);

            gltf.scene.traverse((child) => {
            //     if (child instanceof THREE.Mesh) {
            //         child.castShadow = true;
            //         child.receiveShadow = true;
            //     }

                if (child instanceof THREE.SkinnedMesh) {
                    let material = child.material
                    if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
                        material.depthTest = true;
                        material.depthWrite = true;

                        if (child.name === BONES.emission) {
                            material.emissiveMap = faceTexture;
                            material.emissiveIntensity = 1;
                        }
                    }
                }

                if (child.name === "Bone004_05") {
                    model = child;
                }
            })

            scene.add(gltf.scene);
        },
        undefined,
        function (error) {
            console.error(error);
        }
    );

    const renderScene = new RenderPass(scene, camera);
    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.6,
        0.1,
        0.1
    );
    composer.addPass(bloomPass);

    const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        // model.rotation.x = model.rotation.y += 0.01;
        // renderer.render(scene, camera);
        composer.render();
    }

    animate();
}