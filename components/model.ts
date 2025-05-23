import { FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { predictWebcam } from './landmarking';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
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
    let modelUrl = "" 

    // set to false to use fallback model 
    if (true) {
      // 3d model - Palm Pilot PDA by 3Dee on FAB
      // used under a Personal license as of 15/05/2025
      // https://fab.com/s/14e3b9546fc4
      modelUrl = new URL('./3d/scene.glb', import.meta.url).href
    } else {
      // debug fallback model, license-free made by me.
      // for some reason the image displays upside down and is scaled really tiny
      // fix by modifying model scale and quaternion rotation in render function
      modelUrl = new URL('./3d/pda_foss.glb', import.meta.url).href
    }

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
    const displayCanvas = new FaceDisplayCanvas(canvas);
    // dvdCanvas.render();
    const material = screen.material;
    if (
      material instanceof THREE.MeshStandardMaterial
    ) {
      displayCanvas.wrapS = THREE.RepeatWrapping
      displayCanvas.wrapT = THREE.RepeatWrapping
      
      material.side = THREE.DoubleSide;
      material.map = displayCanvas;
      // material.emissive.set(THREE.Color.NAMES.darkgreen);
      // material.emissiveMap = displayCanvas;
      this.onScreen = displayCanvas;
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

    this.baseModel.quaternion.slerp(quaternion, 0.5);
    this.baseModel.position.lerp(translation, 0.5)
    this.baseModel.scale.lerp(scale.multiplyScalar(0.1), 0.3);

    if (this.onScreen) { 
      this.onScreen.render(landmarkerResults); 
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