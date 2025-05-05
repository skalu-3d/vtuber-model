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
// @ts-ignore
import dvdUrl from './textures/dvd.gif'

export class ShaderTuber {
  private audioContext: AudioContext;
  private faceLandmarker: FaceLandmarker;
  private baseModel: THREE.Object3D;
  private monitorSurface: THREE.Mesh;

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
    textureLoader.load(dvdUrl,
      (texture) => {
        const material = screen.material;
        if (
          material instanceof THREE.MeshBasicMaterial 
          || material instanceof THREE.MeshStandardMaterial
        ) {
          texture.rotation = Math.PI/2;

          texture.wrapS = THREE.RepeatWrapping
          texture.wrapT = THREE.RepeatWrapping

          // const offsetX = 771 / 1024;
          // const offsetY = 404 / 1024;

          // texture.offset.x = aspect > 1 ? (1 - 1 / aspect) / 2 : 0;
          // texture.repeat.x = aspect > 1 ? 1 / aspect : 1;

          // texture.offset.y = aspect > 1 ? 0 : (1 - aspect) / 2;
          // texture.repeat.y = aspect > 1 ? 1 : aspect;
          
          // const normalizer = new UVNormalizer(screen.geometry);
          // normalizer.applyToTexture(texture);

          // texture.offset.set(-offsetX, -offsetY);


          material.map = texture;
          material.map.needsUpdate = true;
        }
      }
    );
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

class UVNormalizer {
  private minU: number;
  private minV: number;
  private scaleU: number;
  private scaleV: number;

  constructor(geometry: THREE.BufferGeometry) {
    const bounds = this.calculateUVBounds(geometry);
    this.minU = bounds.minU;
    this.minV = bounds.minV;
    this.scaleU = 1 / (bounds.maxU - bounds.minU);
    this.scaleV = 1 / (bounds.maxV - bounds.minV);
  }

  applyToTexture(texture: THREE.Texture) {
    texture.repeat.set(this.scaleU, this.scaleV);
    texture.offset.set(-this.minU * this.scaleU, -this.minV * this.scaleV);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
  }

  private calculateUVBounds(geometry: THREE.BufferGeometry) {
    // Implementation similar to UV Remapping example
    const uvAttr = geometry.attributes.uv;
    const uvArray = uvAttr.array as Float32Array;

    // Find current UV bounds
    let minU = Infinity, maxU = -Infinity;
    let minV = Infinity, maxV = -Infinity;
    
    return {
      minU, maxU, minV, maxV
    };
  }
}