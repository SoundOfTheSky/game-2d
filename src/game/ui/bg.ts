import Game from '../game'
import Rect from '../systems/physics/body/rect'
import Vector2 from '../systems/physics/body/vector2'

import UIDynamicPlane from './ui-dynamic-plane'

export default class BG extends UIDynamicPlane {
  public get borderScaled() {
    return 4 * this.scale
  }

  public get tileScaled() {
    return 8 * this.scale
  }

  public constructor(game: Game, rect: Rect, scale: number, priority?: number) {
    super(
      game,
      game.resources['/game/ui.png'] as HTMLImageElement,
      new Vector2(104, 0),
      new Vector2(8, 8),
      rect,
      scale,
      false,
      priority,
    )
  }
}
