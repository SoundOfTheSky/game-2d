import Rect from './rect'

import { IPhysicsBody, PhysicsBody } from '.'

export default class Vector2 implements IPhysicsBody {
  public constructor(
    public x = 0,
    public y = 0,
  ) {}

  // === Mutations ===
  public rotate(angle: number, pivot = new Vector2()): PhysicsBody {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const dx = this.x - pivot.x
    const dy = this.y - pivot.y

    this.x = cos * dx - sin * dy + pivot.x
    this.y = sin * dx + cos * dy + pivot.y

    return this
  }

  public scale() {
    return this
  }

  public add(v: Vector2 | number) {
    if (v instanceof Vector2) {
      this.x += v.x
      this.y += v.y
    } else {
      this.x += v
      this.y += v
    }
    return this
  }

  public subtract(v: Vector2 | number) {
    if (v instanceof Vector2) {
      this.x -= v.x
      this.y -= v.y
    } else {
      this.x -= v
      this.y -= v
    }
    return this
  }

  public multiply(v: Vector2 | number) {
    if (v instanceof Vector2) {
      this.x *= v.x
      this.y *= v.y
    } else {
      this.x *= v
      this.y *= v
    }
    return this
  }

  public devide(v: Vector2 | number) {
    if (v instanceof Vector2) {
      this.x /= v.x
      this.y /= v.y
    } else {
      this.x /= v
      this.y /= v
    }
    return this
  }

  public center() {
    return this
  }

  // === Default ===

  public toString() {
    return `Vector2<${this.x},${this.y}>`
  }

  public *[Symbol.iterator](): Generator<number> {
    yield this.x
    yield this.y
  }

  public equals(v: Vector2) {
    return this.x === v.x && this.y === v.y
  }

  public clone() {
    return new Vector2(this.x, this.y)
  }

  // === Other ===

  public distance(v?: Vector2) {
    if (v) {
      const x = this.x - v.x
      const y = this.y - v.y
      return Math.sqrt(x * x + y * y)
    }
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  /** Get angle of this vector, or between other vector */
  public angle(v?: Vector2, radian?: boolean) {
    const angle = v
      ? Math.atan2(this.x * v.y - this.y * v.x, this.x * v.x + this.y * v.y)
      : Math.atan2(this.y, this.x)
    if (radian) return angle
    return (angle * 180) / Math.PI
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
      this.x *= maxDistance / d
      this.y *= maxDistance / d
    }
    return this
  }

  public dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y
  }

  public lerp(v: Vector2, t: number): this {
    this.x = (v.x - this.x) * t
    this.y = (v.y - this.y) * t
    return this
  }
}
