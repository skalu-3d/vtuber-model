import * as THREE from 'three';

//@ts-ignore
import dvdUrl from './textures/texture.png'

export class DVDCanvas extends THREE.CanvasTexture {
    private pos_x = 50;
    private pos_y = 50;
    private dx = 10;
    private dy = 10;
    private img: HTMLImageElement;
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
        imageLoader.load(dvdUrl,
            (img) => {
                let scale = 0.05;
                // img.width *= scale;
                // img.height *= scale;
                this.width = img.width;
                this.height = img.height;
                this.img = img;
                console.log('loaded dvd logo')
                console.log(this.img);
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
            this.ctx.drawImage(this.img, this.pos_x, this.pos_y);
        }
    }

    render() {
        this.updatePosition();
        this.draw();
        this.needsUpdate = true;
    }
}