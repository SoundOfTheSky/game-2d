import Game from '../game'
import { Tickable, Ticker } from '../ticker'

export default class FPS implements Tickable {
  public fps = ''
  private frames = 0
  private startTime = 0

  public constructor(
    protected game: Game,
    public parent: Ticker,
    public priority = -10_000,
  ) {}

  public tick(): void {
    this.frames++
    if (this.game.time - this.startTime > 1000) {
      this.fps = this.frames + ''
      this.frames = -1
      this.startTime = this.game.time
    }
    this.game.ctx.textAlign = 'right'
    this.game.ctx.fillText(this.fps, this.game.canvas.width, 0)
    this.game.ctx.textAlign = 'left'
  }
}
