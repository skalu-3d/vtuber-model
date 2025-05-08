import { FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { predictWebcam } from './landmarking';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

// @ts-ignore
import vertexShader from './shaders/vertex.glsl'
// @ts-ignore
import fragmentShader from './shaders/fragment.glsl'

// @ts-ignore
// CRT Model by fizyman at Sketchfab: https://skfb.ly/o9BvF
// CC 4.0 https://creativecommons.org/licenses/by/4.0/
import modelUrl from './3d/scene.glb'
import { FaceDisplayCanvas } from './faceDisplayCanvas';

export class ShaderTuber {
  private audioContext: AudioContext;
  private faceLandmarker: FaceLandmarker;
  private baseModel: THREE.Object3D;
  private monitorSurface: THREE.Mesh;
  private onScreen: FaceDisplayCanvas;

  constructor(audioContext: AudioContext, faceLandmarker: FaceLandmarker, envMap: THREE.Texture) {
    this.audioContext = audioContext;
    this.faceLandmarker = faceLandmarker;
  }

  async loadModel() {
    // https://fab.com/s/14e3b9546fc4
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(modelUrl, undefined);
    gltf.scene.traverse((child) => {
      if (child.name === "RootNode") {
        this.baseModel = child;
      }
      if (child.name === "Plane_Material001_0") {
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
    const canvas = document.createElement('canvas');
    canvas.width = 249;
    canvas.height = 312;
    const dvdCanvas = new FaceDisplayCanvas(canvas);
    dvdCanvas.render();
    const material = screen.material;
    if (
      material instanceof THREE.MeshBasicMaterial 
      || material instanceof THREE.MeshStandardMaterial
    ) {
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

    this.baseModel.quaternion.slerp(quaternion, 1);

    this.baseModel.position.set(
      translation.x,
      translation.y,
      translation.z
    );
    this.baseModel.scale.set(scale.x*0.1, scale.y*0.1, scale.z*0.1);

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