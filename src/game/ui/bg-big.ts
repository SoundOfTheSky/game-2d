import Game from '../game'
import Rect from '../physics/body/rect'
import Vector2 from '../physics/body/vector2'
import { Ticker } from '../ticker'

import UIDynamicPlane from './ui-dynamic-plane'

export default class BGBig extends UIDynamicPlane {
  public get borderScaled() {
    return 4 * this.scale
  }

  public get tileScaled() {
    return 16 * this.scale
  }

  public constructor(game: Game, parent: Ticker, rect: Rect, scale: number, priority?: number) {
    super(
      game,
      parent,
      game.resources['/game/ui.png'] as HTMLImageElement,
      new Vector2(),
      new Vector2(16, 16),
      rect,
      scale,
      true,
      priority,
    )
  }
}
