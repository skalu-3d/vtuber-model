import * as THREE from 'three';

//@ts-ignore
import imgUrl from './textures/texture_lcd.png'
//@ts-ignore
import bgUrl from './textures/lcd_bg.png'

export class FaceDisplayCanvas extends THREE.CanvasTexture {
    private pos_x = 10;
    private pos_y = 10;
    private dx = 2;
    private dy = 2;
    private img: HTMLImageElement;
    private bgImg: HTMLImageElement;
    private width;
    private height;
    private canvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor (canvas: HTMLCanvasElement) {
        super(canvas);
        this.canvasElement = canvas;

        let ctx = canvas.getContext('2d');
        if (ctx) {
            this.ctx = ctx
        } else {
            console.error('no canvas 2d context');
        }

        const imageLoader = new THREE.ImageLoader();
        imageLoader.load(imgUrl,
            (img) => {
                this.width = 64;
                this.height = 64;
                this.img = img;
                console.log(this.img);
            },
            undefined,
            (error) => {
                console.error(error);
            }
        )
        imageLoader.load(bgUrl,
            (img) => {
                this.bgImg = img;
            },
            undefined,
            (error) => {
                console.error(error);
            }
        )
    }

    updatePosition() {
        this.pos_x += this.dx;
        this.pos_y += this.dy;

        let hitVertical = false;
        let hitHorizontal = false;

        if (
            this.pos_x + this.width > this.canvasElement.width
            || this.pos_x < 0
        ) {
            this.dx *= -1;
            hitHorizontal = true;
        }

        if (
            this.pos_y + this.height > this.canvasElement.height
            || this.pos_y < 0
        ) {
            this.dy *= -1;
            hitVertical = true;
        }
    }

    draw() {
        if (this.img) {
            this.ctx.reset();
            this.ctx.drawImage(this.bgImg, 0, 0, this.canvasElement.width, this.canvasElement.height);
            this.ctx.filter="drop-shadow(3px 3px 1px rgb(58, 66, 58)) brightness(75%)";
            this.ctx.drawImage(this.img, this.pos_x, this.pos_y, this.width, this.height);
        }
    }

    render() {
        this.updatePosition();
        this.draw();
        this.needsUpdate = true;
    }
}