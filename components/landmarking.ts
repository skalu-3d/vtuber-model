import { FaceLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

// let faceLandMarker: FaceLandmarker;
// let webcamRunning: Boolean = false;
// const videoWidth = 480;

// async function createFaceLandmarker() {
//     const filesetResolver = await FilesetResolver.forVisionTasks(

//     )
// }


let elem = document.getElementById('videoElement');
if (!(elem instanceof HTMLVideoElement)){
    throw new Error('Element is not a video element');
}
const videoElement: HTMLVideoElement = elem;
let stream: MediaStream | null;

export async function startWebcam() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: true
        });
    
        videoElement.srcObject = stream;
        videoElement.play();
    } catch (error) {
        console.error('error accessing webcam:', error);
    }
}