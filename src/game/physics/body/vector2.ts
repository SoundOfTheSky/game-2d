import Rect from './rect'

import { IPhysicsBody, PhysicsBody } from '.'

export default class Vector2 implements IPhysicsBody {
  public constructor(
    public x = 0,
    public y = 0,
  ) {}

  public add(v: Vector2 | number) {
    if (v instanceof Vector2) {
      this.x += v.x
      this.y += v.y
    }
    else {
      this.x += v
      this.y += v
    }
    return this
  }

  public subtract(v: Vector2 | number) {
    if (v instanceof Vector2) {
      this.x -= v.x
      this.y -= v.y
    }
    else {
      this.x -= v
      this.y -= v
    }
    return this
  }

  public multiply(v: Vector2 | number) {
    if (v instanceof Vector2) {
      this.x *= v.x
      this.y *= v.y
    }
    else {
      this.x *= v
      this.y *= v
    }
    return this
  }

  public devide(v: Vector2 | number) {
    if (v instanceof Vector2) {
      this.x /= v.x
      this.y /= v.y
    }
    else {
      this.x /= v
      this.y /= v
    }
    return this
  }

  public clone() {
    return new Vector2(this.x, this.y)
  }

  public distance(v?: Vector2) {
    if (v) return Math.hypot((this.x - v.x), (this.y - v.y))
    return Math.hypot(this.x, this.y)
  }

  public collision(f: PhysicsBody): Vector2 | undefined {
    if (f instanceof Vector2) {
      if (f.x === this.x && f.y === this.y) new Vector2(this.x + 1, this.y)
      return
    }
    return f.collision(this)?.multiply(-1)
  }

  public toRect(): Rect {
    return new Rect(this.clone(), this.clone())
  }

  public normalize(onlyDecrease?: boolean, maxDistance = 1): this {
    const d = this.distance()
    if (onlyDecrease ? d > maxDistance : d !== 0) {
      this.x /= d / maxDistance
      this.y /= d / maxDistance
    }
    return this
  }

  public equals(v: Vector2) {
    return this.x === v.x && this.y === v.y
  }
}
