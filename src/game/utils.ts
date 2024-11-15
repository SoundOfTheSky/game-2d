import Game from './game'
import Vector2 from './physics/body/vector2'

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
    this.game.ctx.strokeStyle = typeof color === 'string' ? color : this.getColor(x1, y1, x2, y2, color)
    this.game.ctx.lineWidth = width
    this.game.ctx.beginPath()
    this.game.ctx.setLineDash(dash ?? [])
    this.game.ctx.moveTo(x1, y1)
    this.game.ctx.lineTo(x2, y2)
    this.game.ctx.stroke()
  }

  public rect(x: number, y: number, w: number, h: number, color: string | string[]) {
    this.game.ctx.strokeStyle = typeof color === 'string' ? color : this.getColor(x, y, x + w, y + h, color)
    this.game.ctx.fillRect(x, y, w, h)
  }

  public getColor(x1: number, y1: number, x2: number, y2: number, color: string | string[]) {
    if (typeof color === 'string') return color
    const gradient = this.game.ctx.createLinearGradient(x1, y1, x2, y2)
    for (let index = 0; index < color.length; index++) gradient.addColorStop(index / (color.length - 1), color[index]!)
    return gradient
  }

  public x(p: number) {
    return this.game.canvas.width * p
  }

  public xn(p: number) {
    return this.game.canvas.width - this.game.canvas.width * p
  }

  public y(p: number) {
    return this.game.canvas.height * p
  }

  public yn(p: number) {
    return this.game.canvas.height - this.game.canvas.height * p
  }

  public loadImage(url: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = document.createElement('img')
      img.src = url
      img.addEventListener('load', () => {
        resolve(img)
      })
      img.addEventListener('onerror', reject)
    })
  }

  public setFontSize(size = 32) {
    return (this.game.ctx.font = `${size}px Minecraft`)
  }

  public text(
    text: string,
    pos: Vector2,
    options: {
      fitWidth?: number
      size?: number
      lineSpacing?: number
    } = {},
  ) {
    options.size ??= 32 * window.devicePixelRatio
    options.lineSpacing ??= 0
    this.setFontSize(options.size)
    this.game.ctx.fillStyle = '#AB3F44'
    this.game.ctx.textBaseline = 'top'
    this.game.ctx.textAlign = 'left'
    for (let index = 1; index <= text.length; index++) {
      const string_ = text.slice(0, index)
      if (
        (options.fitWidth && this.game.ctx.measureText(string_).width > options.fitWidth)
        || (index !== 1 && text[index - 2] === '\n')
      ) {
        this.game.ctx.font = ''
        this.game.ctx.fillText(text.slice(0, index - 1), pos.x, pos.y)
        this.text(text.slice(index - 1), new Vector2(pos.x, pos.y + options.size + options.lineSpacing), options)
        return
      }
    }
    this.game.ctx.fillText(text, pos.x, pos.y)
  }
}
