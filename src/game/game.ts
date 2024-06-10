import Input from './input';
import Rodosskaya from './levels/rodosskaya';
import FPS from './renderable/fps';
import { Ticker } from './ticker';
import Utils from './utils';

export default class Game extends Ticker {
  public ctx!: CanvasRenderingContext2D;
  public boundingBox!: DOMRect;
  public input;
  public utils;
  public time = 0;

  public constructor(public canvas: HTMLCanvasElement) {
    super();
    this.initCanvas();

    this.input = this.addTickable(new Input(this, this));
    this.addTickable(new FPS(this, this));
    this.utils = new Utils(this);

    void Rodosskaya.create(this, this).then((x) => this.addTickable(x));
    // new Test(this);
    // new Test2(this);
    // new Test3(this);
    this.tick(0);
  }

  public initCanvas() {
    this.boundingBox = this.canvas.getBoundingClientRect();
    this.canvas.width = this.boundingBox.width * window.devicePixelRatio;
    this.canvas.height = this.boundingBox.height * window.devicePixelRatio;
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.font = `64px Minecraft`;
    this.ctx.fillStyle = '#fff';
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'left';
  }

  public tick(time: number) {
    const deltaTime = time - this.time;
    this.time = time;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    super.tick(deltaTime);
    requestAnimationFrame((t) => this.tick(~~t));
    // setTimeout(() => {
    //   this.tick(performance.now());
    // }, 100);
  }

  public static loadImage(url: string) {
    return new Promise<HTMLImageElement>((r, j) => {
      const img = document.createElement('img');
      img.src = url;
      img.onload = () => r(img);
      img.onerror = j;
    });
  }
}
