import Game from './game';

export default class Utils {
  public constructor(protected game: Game) {}

  public line(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string | string[],
    width: number,
    dash?: number[],
  ) {
    this.game.ctx.strokeStyle = typeof color === 'string' ? color : this.getColor(x1, y1, x2, y2, color);
    this.game.ctx.lineWidth = width;
    this.game.ctx.beginPath();
    this.game.ctx.setLineDash(dash ?? []);
    this.game.ctx.moveTo(x1, y1);
    this.game.ctx.lineTo(x2, y2);
    this.game.ctx.stroke();
  }

  public rect(x: number, y: number, w: number, h: number, color: string | string[]) {
    this.game.ctx.strokeStyle = typeof color === 'string' ? color : this.getColor(x, y, x + w, y + h, color);
    this.game.ctx.fillRect(x, y, w, h);
  }

  public getColor(x1: number, y1: number, x2: number, y2: number, color: string | string[]) {
    if (typeof color === 'string') return color;
    const gradient = this.game.ctx.createLinearGradient(x1, y1, x2, y2);
    for (let index = 0; index < color.length; index++) gradient.addColorStop(index / (color.length - 1), color[index]);
    return gradient;
  }

  public x(p: number) {
    return this.game.canvas.width * p;
  }

  public xn(p: number) {
    return this.game.canvas.width - this.game.canvas.width * p;
  }

  public y(p: number) {
    return this.game.canvas.height * p;
  }

  public yn(p: number) {
    return this.game.canvas.height - this.game.canvas.height * p;
  }
}
