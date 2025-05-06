import { FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { predictWebcam } from './landmarking';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

//@ts-ignore import texture from local dir
import imgUrl from './textures/crt_texture.gif';

// @ts-ignore
import vertexShader from './shaders/vertex.glsl'
// @ts-ignore
import fragmentShader from './shaders/fragment.glsl'
// @ts-ignore
// CRT Model by fizyman at Sketchfab: https://skfb.ly/o9BvF
// CC 4.0 https://creativecommons.org/licenses/by/4.0/
import tvUrl from './3d/scene.glb'
import { DVDCanvas } from './tvDisplay';
// @ts-ignore
// import dvdUrl from './textures/dvd.gif'

export class ShaderTuber {
  private audioContext: AudioContext;
  private faceLandmarker: FaceLandmarker;
  private baseModel: THREE.Object3D;
  private monitorSurface: THREE.Mesh;
  private onScreen: DVDCanvas;

  constructor(audioContext: AudioContext, faceLandmarker: FaceLandmarker, envMap: THREE.Texture) {
    this.audioContext = audioContext;
    this.faceLandmarker = faceLandmarker;
  }

  async loadModel() {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(tvUrl, undefined);
    gltf.scene.traverse((child) => {
      if (child.name === "CRT_Monitor") {
        this.baseModel = child;
      }
      if (child.name === "CRT_Monitor_monitor_glass_0") {
        if (child instanceof THREE.Mesh) {
          this.monitorSurface = child as THREE.Mesh;
          this.applyScreenContent(this.monitorSurface);
        }
      }
    })
    this.baseModel.castShadow = true;
    this.baseModel.receiveShadow = true;
  }

  private applyScreenContent(screen:THREE.Mesh) {
    const textureLoader = new THREE.TextureLoader();
    console.log(screen);
    // textureLoader.load(imgUrl,
    //   (texture) => {
    //     const material = screen.material;
    //     if (
    //       material instanceof THREE.MeshBasicMaterial 
    //       || material instanceof THREE.MeshStandardMaterial
    //     ) {
    //       texture.rotation = Math.PI/2;

    //       texture.wrapS = THREE.RepeatWrapping
    //       texture.wrapT = THREE.RepeatWrapping

    //       material.map = texture;
    //       material.map.needsUpdate = true;
    //     }
    //   }
    // );
    const canvas = document.createElement('canvas');
    canvas.width = 861;
    canvas.height = 641;
    const dvdCanvas = new DVDCanvas(canvas);
    dvdCanvas.render();
    const material = screen.material;
    if (
      material instanceof THREE.MeshBasicMaterial 
      || material instanceof THREE.MeshStandardMaterial
    ) {
      dvdCanvas.rotation = Math.PI/2;
      dvdCanvas.wrapS = THREE.RepeatWrapping
      dvdCanvas.wrapT = THREE.RepeatWrapping
      
      material.side = THREE.DoubleSide;
      material.map = dvdCanvas;
      this.onScreen = dvdCanvas;
    }
  }

  public getBaseModel() {
    return this.baseModel;
  }

  render() {
    //  Facial Orientation Tracking
    //  Adapted from: https://github.com/jays0606/mediapipe-facelandmark-demo
    let landmarkerResults = predictWebcam(this.faceLandmarker);
    if (!landmarkerResults) return;

    const facialTransformationMatrix = landmarkerResults.facialTransformationMatrixes[0]?.data;
    if (!facialTransformationMatrix) return;
    
    const { translation, rotation, scale } = decomposeMatrix(facialTransformationMatrix);
    const euler = new THREE.Euler(rotation.x*1.5, rotation.y*1.5, rotation.z*1.5, "ZYX");
    const quaternion = new THREE.Quaternion().setFromEuler(euler);

    // Rotate Y axis by 90 degrees
    const axis = new THREE.Vector3(1,0,0);
    const angle = -(Math.PI / 2);
    const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(axis, angle);
    quaternion.multiply(rotationQuaternion);

    this.baseModel.quaternion.slerp(quaternion, 1);

    this.baseModel.position.set(
      translation.x,
      translation.y,
      translation.z
    );
    this.baseModel.scale.set(scale.x*5, scale.y*5, scale.z*5);

    if (this.onScreen) { 
      this.onScreen.render() 
    }
  }
}

function decomposeMatrix(matrix: number[]): {
  translation: THREE.Vector3;
  rotation: THREE.Quaternion;
  scale: THREE.Vector3;
  } {
  let matrix4x4 = new THREE.Matrix4().fromArray(matrix);

  let translation = new THREE.Vector3;
  let rotation = new THREE.Quaternion;
  let scale = new THREE.Vector3;

  matrix4x4.decompose(translation, rotation, scale);

  return {
    translation: translation,
    rotation: rotation,
    scale: scale,
  };
}