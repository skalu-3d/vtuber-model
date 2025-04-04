import { renderScene } from "./components/scene";
import { startWebcam } from "./components/landmarking";

// renderScene();
console.log("running");
try {
    startWebcam();
} catch (e) {
    console.error(e)
}
