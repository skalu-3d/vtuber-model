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
    public pos_x: number;
    public pos_y: number;
    public height: number;
    public width: number;

    constructor(
        img: HTMLImageElement,
        pos_x: number,
        pos_y: number,
        width: number,
        height: number
    ) {
        this.img = img;
        this.pos_x = pos_x;
        this.pos_y = pos_y;
        this.width = width;
        this.height = height;
    }

    drawOnCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        ctx.drawImage(this.img, this.pos_x, this.pos_y, this.width, this.height);
    }
}

export class FaceDisplayCanvas extends THREE.CanvasTexture {
    private img: HTMLImageElement;
    private bgImg: HTMLImageElement;
    private canvasElement: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private facialFeatures: Map<string, FacialFeature>; 
    private leftEye: FacialFeature;
    private rightEye: FacialFeature;

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
                    img, 0, 0, img.width*2, img.height*2
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
    }

    blendshapeDraw(landmarkerResults: FaceLandmarkerResult) {
        // FIXME
        // return
        if (!landmarkerResults) return;
        if (this.facialFeatures.size == 0) return;
        

        drawBlendShapes(landmarkerResults.faceBlendshapes);
        let mouth = this.facialFeatures.get('mouthDefault');
        let mouthShut = true;
        let glasses = this.facialFeatures.get('glassesDefault');
        let leftEye = this.facialFeatures.get('leftEyeDefault');
        let rightEye = this.facialFeatures.get('rightEyeDefault');

        landmarkerResults.faceBlendshapes[0].categories.map((shape) => {
            switch (shape.index) {
                case BLENDSHAPES.jawOpen:
                    switch (true) {
                        case shape.score < 0.1:
                            mouth = this.facialFeatures.get('mouthDefault');
                            break;
                        case shape.score < 0.6:
                            mouth = this.facialFeatures.get('mouthOpen');
                            mouthShut = false;
                            break;
                        default:
                            mouth = this.facialFeatures.get('mouthOpenWide');
                            mouthShut = false;
                            break;
                    }
                    break;
                case BLENDSHAPES.mouthSmileRight:
                    if (mouthShut && shape.score > 0.5) {
                        mouth = this.facialFeatures.get('mouthSmiling');
                        glasses = this.facialFeatures.get('glassesSmiling');
                    }
                    break;
                case BLENDSHAPES.eyeBlinkLeft:
                    if (shape.score > 0.4) {
                        leftEye = this.facialFeatures.get('leftEyeShut');
                    }
                    break;
                case BLENDSHAPES.eyeBlinkRight:
                    if (shape.score > 0.4) {
                        rightEye = this.facialFeatures.get('rightEyeShut');
                    }
                    break;
                default:
                    return;
            }
        });

        this.ctx.reset();
        this.ctx.drawImage(this.bgImg, 0, 0, this.canvasElement.width, this.canvasElement.height);

        this.ctx.filter="drop-shadow(4px 4px 1px rgb(58, 66, 58)) brightness(75%)";
        leftEye?.drawOnCanvas(this.canvasElement, this.ctx);
        rightEye?.drawOnCanvas(this.canvasElement, this.ctx);
        mouth?.drawOnCanvas(this.canvasElement, this.ctx);
        glasses?.drawOnCanvas(this.canvasElement, this.ctx);
        
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