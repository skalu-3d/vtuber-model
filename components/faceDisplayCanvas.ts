import * as THREE from 'three';

const imgUrl = new URL('./textures/texture_lcd.png', import.meta.url).href;
const bgUrl = new URL('./textures/lcd_bg.png', import.meta.url).href;
import { Classifications, FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { BLENDSHAPES } from './blendshapes';
import { SPRITE_URLS } from './sprites';
import { clamp } from 'three/src/math/MathUtils.js';
import { drawBlendShapes } from './landmarking';

class FacialFeature {
    public name: string;
    public img: HTMLImageElement;
    public pos: THREE.Vector2;
    public height: number;
    public width: number;
    private visible = true;

    constructor(
        img: HTMLImageElement,
        pos_x: number,
        pos_y: number,
        width: number,
        height: number
    ) {
        this.img = img;
        this.pos = new THREE.Vector2(pos_x, pos_y);
        this.width = width;
        this.height = height;
    }

    setVisibility(val: boolean) {
        this.visible = val;
    }

    drawOnCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        if (this.visible) ctx.drawImage(this.img, this.pos.x, this.pos.y, this.width, this.height);
    }
}

export class FaceDisplayCanvas extends THREE.CanvasTexture {
    private img: HTMLImageElement;
    private bgImg: HTMLImageElement;
    private canvasElement: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private facialFeatures: Map<string, FacialFeature>;
    private mouth: FacialFeature | undefined;
    private mouthShut: true;
    private glasses: FacialFeature | undefined;
    private leftEye: FacialFeature | undefined;
    private rightEye: FacialFeature | undefined;
    private leftBrow: FacialFeature | undefined;
    private rightBrow: FacialFeature | undefined;

    constructor (canvas: HTMLCanvasElement) {
        super(canvas);
        this.canvasElement = canvas;
        this.facialFeatures = new Map();

        let ctx = canvas.getContext('2d');
        if (ctx) {
            this.ctx = ctx
        } else {
            console.error('no canvas 2d context');
        }

        const imageLoader = new THREE.ImageLoader();
        imageLoader.load(bgUrl,
            (img) => {
                this.bgImg = img;
            },
            undefined,
            (error) => {
                console.error(error);
            }
        )

        SPRITE_URLS.forEach((url, spriteName) => {
            imageLoader.load(url, (img) => {   
                const newFeature = new FacialFeature(
                    img, 0, 0, img.width, img.height
                );
                this.facialFeatures.set(spriteName, newFeature);
                // console.log(newFeature);
            },
            undefined,
            (error) => {
                console.error(error);
            })
        });


        console.log(this.facialFeatures);
        document.addEventListener("keydown", this.onKeyDown, false);
    }

    blendshapeDraw(landmarkerResults: FaceLandmarkerResult) {
        // FIXME
        // return
        if (!landmarkerResults) return;
        if (this.facialFeatures.size == 0) return;
        

        drawBlendShapes(landmarkerResults.faceBlendshapes);
        // let mouth = this.facialFeatures.get('mouthx1y0');
        let mouthShut = true;
        let jawOpenScore = 0;
        let mouthPuckerScore = 0;
        this.leftEye = this.facialFeatures.get('leftEyeDefault');
        this.rightEye = this.facialFeatures.get('rightEyeDefault');
        this.glasses = this.facialFeatures.get('glassesDefault');
        this.leftBrow = this.facialFeatures.get('browLeft');
        this.rightBrow = this.facialFeatures.get('browRight');
        let lookIn = 0;
        let lookOut = 0;
        let lookUp = 0;
        let lookDown = 0;

        landmarkerResults.faceBlendshapes[0].categories.map((shape) => {
            // NOTE: movement via lerp
            // TODO: mouth side to side movement
            // TODO: pupil movement

            switch (shape.index) {
                case BLENDSHAPES.jawOpen:
                    jawOpenScore = shape.score;
                    break;
                case BLENDSHAPES.mouthPucker:
                    mouthPuckerScore = shape.score;
                    break;
                case BLENDSHAPES.eyeBlinkLeft:
                    if (shape.score > 0.3) {
                        this.leftEye = this.facialFeatures.get('leftEyeShut');
                    }
                    break;
                case BLENDSHAPES.eyeBlinkRight:
                    if (shape.score > 0.3) {
                        this.rightEye = this.facialFeatures.get('rightEyeShut');
                    }
                    break;
                case BLENDSHAPES.eyeWideLeft:
                    if (shape.score > 0.25) {
                        this.leftEye = this.facialFeatures.get('leftEyeWide');
                    } break;
                case BLENDSHAPES.eyeWideRight:
                    if (shape.score > 0.25) {
                        this.rightEye= this.facialFeatures.get('rightEyeWide');
                    } break;
                case BLENDSHAPES.eyeLookOutLeft:
                    lookOut = shape.score; break;
                case BLENDSHAPES.eyeLookInLeft:
                    lookIn = shape.score; break;
                case BLENDSHAPES.eyeLookUpLeft:
                    lookUp = shape.score; break;
                case BLENDSHAPES.eyeLookDownLeft:
                    lookDown = shape.score; break;
                case BLENDSHAPES.browOuterUpLeft:
                    this.leftBrow?.setVisibility(true);
                    if (shape.score < 0.1) {
                        this.leftBrow?.pos.lerp(new THREE.Vector2(0, 16), 0.3);
                    } else if (shape.score > 0.6) {
                        this.leftBrow?.pos.lerp(new THREE.Vector2(0, -48), 0.3);
                    } else {
                        this.leftBrow?.pos.set(0, 0);
                        this.leftBrow?.setVisibility(false);
                    } break;
                case BLENDSHAPES.browOuterUpRight:
                    this.rightBrow?.setVisibility(true);
                    if (shape.score < 0.1) {
                        this.rightBrow?.pos.lerp(new THREE.Vector2(0, 16), 0.3);
                    } else if (shape.score > 0.6) {
                        this.rightBrow?.pos.lerp(new THREE.Vector2(0, -48), 0.3);
                    } else {
                        this.rightBrow?.pos.set(0, 0);
                        this.rightBrow?.setVisibility(false);
                    } break;
                default:
                    return;
            }
        });

        this.ctx.reset();
        this.ctx.drawImage(this.bgImg, 0, 0, this.canvasElement.width, this.canvasElement.height);

        this.mouth = this.setMouthShape(jawOpenScore, mouthPuckerScore);

        this.ctx.filter="drop-shadow(4px 4px 1px rgb(58, 66, 58)) brightness(75%)";
        this.leftEye?.drawOnCanvas(this.canvasElement, this.ctx);
        this.rightEye?.drawOnCanvas(this.canvasElement, this.ctx);
        this.mouth?.drawOnCanvas(this.canvasElement, this.ctx);
        this.glasses?.drawOnCanvas(this.canvasElement, this.ctx);
        this.leftBrow?.drawOnCanvas(this.canvasElement, this.ctx);
        this.rightBrow?.drawOnCanvas(this.canvasElement, this.ctx);
    }


    // TODO: special faces override
    onKeyDown(event) {
        console.log(event);
        var key = event.key;

        if (key === "1") {

        }
    }

    // TODO: pupil position offset calculation
    setEyeOffset(lookIn: number, lookOut: number): THREE.Vector2 {

        return new THREE.Vector2(0, 0);
    }

    setMouthShape(jawOpenScore: number, mouthPuckerScore: number): FacialFeature | undefined {
        let x = 0;
        let y = 0;

        if (jawOpenScore < 0.15) {
            y = 0;           
        } else if (jawOpenScore < 0.55) {
            y = 1;           
        } else {
            y = 2;           
        }

        if (mouthPuckerScore > 0.98) {
            x = 0;
        } else if (mouthPuckerScore > 0.15) {
            x = 1;
        } else {
            x = 2;
        }

        if (x === 0 && y === 0) {
            return this.facialFeatures.get('mouthx0y0');
        } else if (x === 0 && y === 1) {
            return this.facialFeatures.get('mouthx0y1');
        } else if (x === 0 && y === 2) {
            return this.facialFeatures.get('mouthx0y2');
        } else if (x === 1 && y === 0) {
            return this.facialFeatures.get('mouthx1y0');
        } else if (x === 1 && y === 1) {
            return this.facialFeatures.get('mouthx1y1');
        } else if (x === 1 && y === 2) {
            return this.facialFeatures.get('mouthx1y2');
        } else if (x === 2 && y === 0) {
            return this.facialFeatures.get('mouthx2y0');
        } else if (x === 2 && y === 1) {
            return this.facialFeatures.get('mouthx2y1');
        } else if (x === 2 && y === 2) {
            return this.facialFeatures.get('mouthx2y2');
        }
    }

    // dvdBounceUpdatePosition() {
    //     this.pos_x += this.dx;
    //     this.pos_y += this.dy;

    //     let hitVertical = false;
    //     let hitHorizontal = false;

    //     if (
    //         this.pos_x + this.width > this.canvasElement.width
    //         || this.pos_x < 0
    //     ) {
    //         this.dx *= -1;
    //         hitHorizontal = true;
    //     }

    //     if (
    //         this.pos_y + this.height > this.canvasElement.height
    //         || this.pos_y < 0
    //     ) {
    //         this.dy *= -1;
    //         hitVertical = true;
    //     }
    // }

    // dvdBounceDraw() {
    //     this.dvdBounceUpdatePosition();
    //     if (this.img) {
    //         this.ctx.reset();
    //         this.ctx.drawImage(this.bgImg, 0, 0, this.canvasElement.width, this.canvasElement.height);
    //         this.ctx.filter="drop-shadow(3px 3px 1px rgb(58, 66, 58)) brightness(75%)";
    //         this.ctx.drawImage(this.img, this.pos_x, this.pos_y, this.width, this.height);
    //     }
    // }

    render(landmarkerResults: FaceLandmarkerResult) {
        if (!landmarkerResults) return;
        this.blendshapeDraw(landmarkerResults);
        this.needsUpdate = true;
    }
}