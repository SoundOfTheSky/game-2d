import Game from '../game';
import Rect from '../physics/body/rect';
import Vector2 from '../physics/body/vector2';
import { Tickable, Ticker } from '../ticker';

export default class UIDynamicPlane implements Tickable {
  private canvas = document.createElement('canvas');
  public constructor(
    public game: Game,
    public parent: Ticker,
    public source: HTMLImageElement,
    public sourcePos: Vector2,
    public tileSize: Vector2,
    public rect: Rect,
    public scale = 1,
    public isLarge = false,
    public priority = 100,
  ) {}

  // eslint-disable-next-line sonarjs/cognitive-complexity
  public updateImage() {
    const { ctx } = Game.initCanvas(this.canvas, this.rect.w, this.rect.h);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const tileSizeX = this.tileSize.x * this.scale;
    const tileSizeY = this.tileSize.y * this.scale;
    let w = ~~(this.rect.w / tileSizeX);
    let h = ~~(this.rect.h / tileSizeY);
    if (this.isLarge) {
      if (w > 5 && w % 2 === 0) w--;
      if (h > 5 && h % 2 === 0) h--;
    }
    const paddingX = (this.rect.w % tileSizeX) / 2;
    const paddingY = (this.rect.h % tileSizeY) / 2;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let tileX = 1;
        let tileY = 1;
        if (y === 0) tileY = 0;
        else if (y === h - 1) tileY = this.isLarge ? 4 : 2;
        else if (this.isLarge && y === (h + 1) / 2) tileY = 2;
        if (x === 0) tileX = 0;
        else if (x === w - 1) tileX = this.isLarge ? 4 : 2;
        else if (this.isLarge && x === (w + 1) / 2) tileX = 2;
        ctx.drawImage(
          this.source,
          this.sourcePos.x + this.tileSize.x * tileX,
          this.sourcePos.y + this.tileSize.y * tileY,
          this.tileSize.x,
          this.tileSize.y,
          paddingX + this.rect.a.x + tileSizeX * x,
          paddingY + this.rect.a.y + tileSizeY * y,
          tileSizeX,
          tileSizeY,
        );
      }
    }
  }

  public tick() {
    this.game.ctx.drawImage(this.canvas, this.rect.a.x, this.rect.a.y);
  }
}
