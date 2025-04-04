# shader-thingy
A "Shadertuber" experiment. Captures facial landmarks and voice to manipulate shader output.

## Running the app
Ensure you have the package `npm`, then in the project root directory run
```bash
wget -P ./components/models https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task
wget -P ./components/wasm/ -r -np -nH --cut-dirs 4 https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm/

npm install
npx vite
```