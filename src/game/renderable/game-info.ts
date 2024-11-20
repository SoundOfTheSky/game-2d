import { Tickable } from '../ticker'

export default class GameInfo extends Tickable {
  public fps = ''
  public properties: Record<string, string | number | boolean> = {}
  private frames = 0
  private startTime = 0

  public tick(deltaTime: number): void {
    this.frames++
    if (this.game.time - this.startTime > 1000) {
      this.fps = this.frames + ''
      this.frames = -1
      this.startTime = this.game.time
    }
    this.game.ctx.textAlign = 'right'
    this.game.ctx.fillStyle = '#FFFFFF'
    this.game.ctx.fillText(this.fps, this.game.canvas.width, 0)
    let y = 48
    for (const key in this.properties) {
      this.game.ctx.fillText(`${key}: ${this.properties[key]!}`, this.game.canvas.width, y)
      y += 48
    }
    this.game.ctx.fillStyle = '#AB3F44'
    this.game.ctx.textAlign = 'left'
    super.tick(deltaTime)
  }
}
