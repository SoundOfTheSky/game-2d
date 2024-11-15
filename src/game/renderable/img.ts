import Game from '../game'
import Vector2 from '../physics/body/vector2'
import { Tickable, Ticker } from '../ticker'

export default class Img implements Tickable {
  public show = true

  public constructor(
    protected game: Game,
    public parent: Ticker,
    public source: HTMLImageElement,
    public pos = new Vector2(),
    public size = new Vector2(),
    public offset = new Vector2(),
    public scale = 1,
    public priority = 0,
  ) {
    if (this.size.x === 0) this.size.x = this.source.naturalWidth
    if (this.size.y === 0) this.size.y = this.source.naturalHeight
  }

  public tick(): void {
    if (!this.show) return
    this.game.ctx.drawImage(
      this.source,
      this.offset.x,
      this.offset.y,
      this.size.x,
      this.size.y,
      this.pos.x,
      this.pos.y,
      this.size.x * this.scale,
      this.size.y * this.scale,
    )
  }
}
