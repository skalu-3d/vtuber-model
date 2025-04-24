import { FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { predictWebcam } from './landmarking';
import * as THREE from 'three';

//@ts-ignore import texture from local dir
import imgUrl from './textures/texture.gif';

export class ShaderTuber extends THREE.Mesh {
  private audioContext: AudioContext;
  private faceLandmarker: FaceLandmarker;

  constructor(audioContext: AudioContext, faceLandmarker: FaceLandmarker) {
    super();
    this.audioContext = audioContext;
    this.faceLandmarker = faceLandmarker;

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(imgUrl);

    this.geometry = new THREE.BoxGeometry(10, 10, 10);
    this.material = new THREE.MeshStandardMaterial({
      // color: new THREE.Color('cyan').convertSRGBToLinear(),
      // roughness: 0.2,
      // metalness: 0.7,
      map: texture
      // wireframe: true
    });

    // console.log(this.material)
    
    this.castShadow = true;
    this.receiveShadow = true;
  }

  render() {
    let landmarkerResults = predictWebcam(this.faceLandmarker);
    if (!landmarkerResults) return;

    const facialTransformationMatrix = landmarkerResults.facialTransformationMatrixes[0]?.data;
    if (!facialTransformationMatrix) return;
    
    const { translation, rotation, scale } = decomposeMatrix(facialTransformationMatrix);
    const euler = new THREE.Euler(rotation.x*1.5, rotation.y*1.5, rotation.z*1.5, "ZYX");
    const quaternion = new THREE.Quaternion().setFromEuler(euler);

    // quaternion.x *= -1;    
    // quaternion.y *= -1;    
    // quaternion.z *= -1;    

    this.quaternion.slerp(quaternion, 1.0);
    // this.rotation.x = this.rotation.y += 0.01


    this.position.set(
      translation.x,
      translation.y,
      translation.z
    );
    this.scale.set(scale.x, scale.y, scale.z);
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