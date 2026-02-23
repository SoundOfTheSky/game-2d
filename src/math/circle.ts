import Line from './line'
import Rect from './rect'
import Vector2 from './vector2'

import { IPhysicsBody, PhysicsBody } from '.'

export default class Circle implements IPhysicsBody {
  public constructor(
    public c = new Vector2(),
    public r = 0,
  ) {}

  public center() {
    return this.c
  }

  public rotate(angle: number, pivot = this.c) {
    this.c.rotate(angle, pivot)
    return this
  }

  public scale(v: Vector2 | number) {
    this.r *= Math.max(
      typeof v === 'number' ? v : v.x,
      typeof v === 'number' ? v : v.y,
    )
    return this
  }

  public add(v: Vector2 | number) {
    this.c.add(v)
    return this
  }

  public devide(v: Vector2 | number) {
    this.c.devide(v)
    return this
  }

  public multiply(v: Vector2 | number) {
    this.c.multiply(v)
    return this
  }

  public subtract(v: Vector2 | number) {
    this.c.subtract(v)
    return this
  }

  public clone() {
    return new Circle(this.c.clone(), this.r)
  }

  public collision(f: PhysicsBody): Vector2 | undefined {
    if (f instanceof Vector2) {
      const d = this.c.distance(f) - this.r
      if (d < 0) return this.c.clone().subtract(f).normalize().multiply(d)
      return
    }
    if (f instanceof Line || f instanceof Rect)
      return f.toPoly().collision(this)?.multiply(-1)
    if (f instanceof Circle) {
      const d = this.c.distance(f.c) - this.r - f.r
      if (d < 0) return this.c.clone().subtract(f.c).normalize().multiply(d)
      return
    }
    return f.collision(this)?.multiply(-1)
  }

  public toRect(): Rect {
    return new Rect(
      new Vector2(this.c.x - this.r, this.c.y - this.r),
      new Vector2(this.c.x + this.r, this.c.y + this.r),
    )
  }
}
