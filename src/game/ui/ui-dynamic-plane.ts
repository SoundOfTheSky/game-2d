import Game from '../game'
import Rect from '../physics/body/rect'
import Vector2 from '../physics/body/vector2'
import { Tickable, Ticker } from '../ticker'

export default class UIDynamicPlane implements Tickable {
  public canvas = document.createElement('canvas')
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
  ) {
    this.updateImage()
  }

  public getSizes() {
    const tileSize = this.tileSize.clone().multiply(this.scale)
    // Size in tiles. If more than 5, make it odd to add custom decorations
    const size = new Vector2(~~(this.rect.w / tileSize.x), ~~(this.rect.h / tileSize.y))
    if (this.isLarge) {
      if (size.x > 5 && size.x % 2 === 0) size.x--
      if (size.y > 5 && size.y % 2 === 0) size.y--
    }
    const padding = new Vector2(
      ~~((this.rect.w - size.x * tileSize.x) / 2),
      ~~((this.rect.h - size.y * tileSize.y) / 2),
    )
    return {
      padding,
      size,
      tileSize,
    }
  }

  public getTileIndex(index: number, size: number) {
    let tile = 1
    if (index === 0) tile = 0
    else if (index === size - 1) tile = this.isLarge ? 4 : 2
    else if (this.isLarge && index === (size - 1) / 2) tile = 2
    return tile
  }

  public updateImage() {
    const { ctx } = Game.initCanvas(this.canvas, this.rect.w, this.rect.h)
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    const { padding, size, tileSize } = this.getSizes()
    for (let y = 0; y < size.y; y++)
      for (let x = 0; x < size.x; x++)
        ctx.drawImage(
          this.source,
          this.sourcePos.x + this.tileSize.x * this.getTileIndex(x, size.x),
          this.sourcePos.y + this.tileSize.y * this.getTileIndex(y, size.y),
          this.tileSize.x,
          this.tileSize.y,
          padding.x + tileSize.x * x,
          padding.y + tileSize.y * y,
          tileSize.x,
          tileSize.y,
        )
  }

  public tick() {
    this.game.ctx.drawImage(this.canvas, this.rect.a.x, this.rect.a.y)
    // this.game.ctx.strokeRect(this.rect.a.x, this.rect.a.y, this.rect.w, this.rect.h);
  }
}
