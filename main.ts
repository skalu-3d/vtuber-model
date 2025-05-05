import { renderScene } from "./components/scene";
import { startWebcam, createFaceLandmarker, predictWebcam } from "./components/landmarking";

try {
    await startWebcam();
    const faceLandmarker = await createFaceLandmarker();
    renderScene(faceLandmarker);
} catch (e) {
    console.error(e)
}
