import Vector2 from '../systems/physics/body/vector2'

import Entity, { EntityImage } from './entity'

export enum Direction {
  UP = 'Up',
  DOWN = 'Down',
  RIGHT = 'Right',
  LEFT = 'Left',
}

export default class DynamicEntity<IMG extends EntityImage = EntityImage, Meta = unknown> extends Entity<IMG, Meta> {
  public direction = Direction.DOWN
  public maxSpeed = 0.3
  public velocity = new Vector2()
  public acceleration = new Vector2()

  public tick(deltaTime: number): void {
    this.velocity.add(this.acceleration).normalize(true, this.maxSpeed)
    if (this.velocity.x !== 0 || this.velocity.y !== 0) {
      if (Math.abs(this.velocity.y) > Math.abs(this.velocity.x)) {
        this.direction = this.velocity.y > 0 ? Direction.DOWN : Direction.UP
      }
      else if (this.velocity.x > 0) this.direction = Direction.RIGHT
      else this.direction = Direction.LEFT
    }
    super.tick(deltaTime)
  }
}
