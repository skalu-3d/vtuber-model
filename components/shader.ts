import { FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { predictWebcam } from './landmarking';
import * as THREE from 'three';

//@ts-ignore import texture from local dir
import imgUrl from './textures/texture.gif';

// @ts-ignore
import vertexShader from '../components/shaders/vertex.glsl'
// @ts-ignore
import fragmentShader from '../components/shaders/fragment.glsl'

export class ShaderTuber extends THREE.Mesh {
  private audioContext: AudioContext;
  private faceLandmarker: FaceLandmarker;
  material: THREE.ShaderMaterial;

  constructor(audioContext: AudioContext, faceLandmarker: FaceLandmarker, envMap: THREE.Texture) {
    super();
    this.audioContext = audioContext;
    this.faceLandmarker = faceLandmarker;

    this.geometry = new THREE.IcosahedronGeometry(16, 16);
    this.material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            waveSpeed: { value: 0.2 },
            waveScale: { value: 0.1 },
            distortionScale: { value: 3 },
            envMap: { value: envMap },
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

    this.quaternion.slerp(quaternion, 1.0);

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