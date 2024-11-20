import Game from '../game'

import Entity, { EntityImage } from './entity'

export default class Trail<IMG extends EntityImage = EntityImage, Meta = unknown> extends Entity<IMG, Meta> {
  public despawnTime
  public name = 'trail'

  public constructor(game: Game,
    img?: IMG,
    priority?: number) {
    super(game, img, priority)
    this.despawnTime = this.game.time + 200
  }

  public tick(deltaTime: number): void {
    if (this.despawnTime < this.game.time)
      this.destroy()
    super.tick(deltaTime)
  }
}
