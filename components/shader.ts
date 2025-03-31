import * as THREE from 'three';

export class ShaderTuber extends THREE.Mesh {
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    super();
    this.audioContext = audioContext;
    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    this.material = new THREE.MeshStandardMaterial({
      color: new THREE.Color('cyan').convertSRGBToLinear()
    });
  }

  render() {
    this.rotation.x = this.rotation.y += 0.01
  }
}