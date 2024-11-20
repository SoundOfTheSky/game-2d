import Game from '../game'
import Rect from '../physics/body/rect'
import Vector2 from '../physics/body/vector2'
import Img from '../renderable/img'
import { Ticker } from '../ticker'

import BG from './bg'
import BGBig from './bg-big'

export type DialogueItem = {
  text: string
  auto?: number
  next?: (options: { item: DialogueItem, textI: number, timeSinceLastChange: number }) => boolean
  speed?: number
  sound?: HTMLAudioElement
  portrait?: Img
  name?: string
}
export default class Dialogue extends Ticker {
  public bgUI!: BGBig
  public nameUI!: BG
  public queue: DialogueItem[] = []
  public text = ''
  public name = '???'
  public portrait?: Img
  public scale = 4
  public fontSize!: number
  public fontSpacing!: number
  private queueI = 0
  private textI = 0
  private lastLetterTime = 0
  private textPos!: Vector2
  private namePos!: Vector2
  private portraitPos!: Vector2
  private portraitScale!: number

  public constructor(
    game: Game,
    item: DialogueItem,
    priority?: number,
  ) {
    super(game, priority)
    this.queue.push(item)
    this.updateUIs()
  }

  public updateUIs() {
    const scale = this.scale * window.devicePixelRatio
    const bgTileSize = 16
    const bgTileScaled = bgTileSize * scale
    const nameTileSize = 8
    const nameTileScaled = nameTileSize * scale
    this.fontSize = 6 * scale
    this.fontSpacing = 2 * scale
    this.bgUI = new BGBig(
      this.game,
      new Rect(
        // 3.5 so UI has some padding
        new Vector2(0, this.game.canvas.height - ~~Math.min(bgTileScaled * 3.5, this.game.canvas.height / 3)),
        new Vector2(this.game.canvas.width, this.game.canvas.height),
      ),
      scale,
    )
    const { padding } = this.bgUI.getSizes()
    this.textPos = this.bgUI.rect.a.clone().add(padding)
    const portraitSize = this.bgUI.rect.h - padding.y * 2 - bgTileScaled
    this.portraitPos = this.bgUI.rect.b
      .clone()
      .subtract(padding)
      .subtract(portraitSize)
      .subtract(new Vector2(this.bgUI.tileScaled, this.bgUI.borderScaled))
    this.portraitScale = portraitSize / 64
    this.nameUI = new BG(
      this.game,
      new Rect(
        new Vector2(
          this.bgUI.rect.a.x + padding.x + this.bgUI.borderScaled * 2,
          this.bgUI.rect.a.y + padding.y - this.bgUI.borderScaled,
        ),
        new Vector2(
          this.bgUI.rect.a.x + padding.x + this.bgUI.borderScaled + nameTileScaled * 12,
          this.bgUI.rect.a.y + padding.y - this.bgUI.borderScaled + nameTileScaled * 2,
        ),
      ),
      scale,
    )
    this.namePos = this.nameUI.rect.a
      .clone()
      .add(this.nameUI.getSizes().padding)
      .add(new Vector2(this.nameUI.tileScaled, this.nameUI.tileScaled / 2 + scale * 2))
    this.textPos.add(new Vector2(bgTileScaled, bgTileScaled))
  }

  public tick(deltaTime: number): void {
    const item = this.queue[this.queueI]!
    this.name = item.name ?? '???'
    let timeSinceLastChange = this.game.time - this.lastLetterTime
    const speed = item.speed ?? 70
    while (timeSinceLastChange > speed && item.text.length !== this.textI) {
      timeSinceLastChange -= speed
      const letter = item.text[this.textI++]
      switch (letter) {
        case '_': {
          break
        }
        case '<': {
          this.text = this.text.slice(0, -1)
          void item.sound?.play()
          break
        }
        default: {
          this.text += letter
          void item.sound?.play()
          break
        }
      }
      this.lastLetterTime = this.game.time - timeSinceLastChange
    }
    super.tick(deltaTime)
    this.bgUI.tick(deltaTime)
    this.nameUI.tick(deltaTime)
    this.game.utils.text(this.text, this.textPos, {
      fitWidth: this.game.canvas.width - this.textPos.x * 2,
      size: this.fontSize,
      lineSpacing: this.fontSpacing,
    })
    this.game.ctx.fillText(this.name, this.namePos.x, this.namePos.y)
    if (item.portrait) {
      item.portrait.pos = this.portraitPos
      item.portrait.scale = this.portraitScale
      item.portrait.tick(deltaTime)
    }
    if (item.next?.({ item, textI: this.textI, timeSinceLastChange })) {
      this.queueI++
      this.textI = 0
      this.lastLetterTime = this.game.time
    }
  }
}
