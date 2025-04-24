import { FaceLandmarker, FilesetResolver, DrawingUtils, FaceLandmarkerResult } from '@mediapipe/tasks-vision';

const videoElement: HTMLVideoElement = document.getElementById('videoElement') as HTMLVideoElement;
const canvasElement: HTMLCanvasElement = document.getElementById('outputCanvas') as HTMLCanvasElement;
const blendShapesElement: HTMLUListElement = document.getElementById('videoBlendShapes') as HTMLUListElement;
let canvasCtx: CanvasRenderingContext2D;

let stream: MediaStream | null;
export async function startWebcam() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: true
        });
    
        videoElement.srcObject = stream;
        videoElement.play();
        // videoElement.addEventListener("loadeddata", predictWebcam);
    } catch (error) {
        console.error('error accessing webcam:', error);
    }
}

export async function createFaceLandmarker() {
    const filesetResolver = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm')
    const faceLandmarker = await FaceLandmarker.createFromOptions(
        filesetResolver,
        {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
                delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        numFaces: 1,
        runningMode: "VIDEO"
    });
    return faceLandmarker;
}

let lastVideoTime = -1;
const videoWidth = 480;

export function predictWebcam(faceLandmarker: FaceLandmarker) {
    let results: FaceLandmarkerResult | null = null;

    const ratio = videoElement.videoHeight / videoElement.videoWidth;
    videoElement.style.width = videoWidth + "px";
    videoElement.style.height = videoWidth * ratio + "px";
    canvasElement.style.width = videoWidth + "px";
    canvasElement.style.height = videoWidth * ratio + "px";
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    let startTimeMs = performance.now();
    if (lastVideoTime !== videoElement.currentTime) {
        lastVideoTime = videoElement.currentTime;
        results = faceLandmarker.detectForVideo(videoElement, startTimeMs)
    }

    return results;
}

function drawBlendShapes(el: HTMLElement, blendShapes: any[]) {
    if (!blendShapes.length) {
        return;
    }

    // console.log(blendShapes[0]);

    let htmlMaker = ""
    blendShapes[0].categories.map((shape) => {
        htmlMaker += `
        <li class="blend-shapes-item">
            <span class="blend-shapes-label">${
            shape.displayName || shape.categoryName
            }</span>
            <span class="blend-shapes-value" style="width: calc(${
            +shape.score * 100
            }% - 120px)">${(+shape.score).toFixed(4)}</span>
        </li>
        `;
    });

    el.innerHTML = htmlMaker
}

// export async function predictWebcamArchived() {
//     const ratio = videoElement.videoHeight / videoElement.videoWidth;
//     videoElement.style.width = videoWidth + "px";
//     videoElement.style.height = videoWidth * ratio + "px";
//     canvasElement.style.width = videoWidth + "px";
//     canvasElement.style.height = videoWidth * ratio + "px";
//     canvasElement.width = videoElement.videoWidth;
//     canvasElement.height = videoElement.videoHeight;

//     let startTimeMs = performance.now();
//     if (lastVideoTime !== videoElement.currentTime) {
//         lastVideoTime = videoElement.currentTime;
//         results = faceLandMarker.detectForVideo(videoElement, startTimeMs)
//     }

//     if (results?.faceLandmarks) {
//         let ctx = canvasElement.getContext("2d")
//         if (ctx == null) {
//             throw new Error("Canvas element has no 2d context")
//         }

//         const drawingUtils = new DrawingUtils(ctx);
//         for (const landmarks of results.faceLandmarks) {
//             drawingUtils.drawConnectors(
//                 landmarks,
//                 FaceLandmarker.FACE_LANDMARKS_TESSELATION,
//                 { color: "#C0C0C070", lineWidth: 1 }
//             );
//             drawingUtils.drawConnectors(
//                 landmarks,
//                 FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
//                 { color: "#FF3030" }
//             );
//             drawingUtils.drawConnectors(
//                 landmarks,
//                 FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
//                 { color: "#FF3030" }
//             );
//             drawingUtils.drawConnectors(
//                 landmarks,
//                 FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
//                 { color: "#30FF30" }
//             );
//             drawingUtils.drawConnectors(
//                 landmarks,
//                 FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
//                 { color: "#30FF30" }
//             );
//             drawingUtils.drawConnectors(
//                 landmarks,
//                 FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
//                 { color: "#E0E0E0" }
//             );
//             drawingUtils.drawConnectors(
//                 landmarks,
//                 FaceLandmarker.FACE_LANDMARKS_LIPS,
//                 { color: "#E0E0E0" }
//             );
//             drawingUtils.drawConnectors(
//                 landmarks,
//                 FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
//                 { color: "#FF3030" }
//             );
//             drawingUtils.drawConnectors(
//                 landmarks,
//                 FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
//                 { color: "#30FF30" }
//             );
//         }
//     drawBlendShapes(blendShapesElement, results.faceBlendshapes)
//     }

//     window.requestAnimationFrame(predictWebcam);
// }