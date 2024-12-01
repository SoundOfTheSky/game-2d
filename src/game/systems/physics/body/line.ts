import Poly from './poly'
import Rect from './rect'
import Vector2 from './vector2'

import { IPhysicsBody, PhysicsBody } from '.'

export default class Line implements IPhysicsBody {
  public constructor(
    public a: Vector2,
    public b: Vector2,
  ) {}

  public center() {
    return new Vector2((this.a.x + this.b.x) / 2, (this.a.y + this.b.y) / 2)
  }

  public rotate(angle: number, pivot = this.center()) {
    this.a.rotate(angle, pivot)
    this.b.rotate(angle, pivot)
    return this
  }

  public scale(v: Vector2 | number) {
    const center = this.center()
    const scaleX = typeof v === 'number' ? v : v.x
    const scaleY = typeof v === 'number' ? v : v.y
    this.a.x = center.x + (this.a.x - center.x) * scaleX
    this.a.y = center.y + (this.a.y - center.y) * scaleY
    this.b.x = center.x + (this.b.x - center.x) * scaleX
    this.b.y = center.y + (this.b.y - center.y) * scaleY
    return this
  }

  public add(v: Vector2 | number) {
    this.a.add(v)
    this.b.add(v)
    return this
  }

  public devide(v: Vector2 | number) {
    this.a.devide(v)
    this.b.devide(v)
    return this
  }

  public multiply(v: Vector2 | number) {
    this.a.multiply(v)
    this.b.multiply(v)
    return this
  }

  public subtract(v: Vector2 | number) {
    this.a.subtract(v)
    this.b.subtract(v)
    return this
  }

  public clone() {
    return new Line(this.a.clone(), this.b.clone())
  }

  public getDistance() {
    return this.a.distance(this.b)
  }

  public toPoly() {
    return new Poly(this.a.clone(), this.b.clone())
  }

  public splitWithPoint(v: Vector2) {
    return [new Line(this.a.clone(), v.clone()), new Line(v.clone(), this.b.clone())] as const
  }

  public collision(f: PhysicsBody): Vector2 | undefined {
    if (f instanceof Vector2) {
      if (this.a.distance(f) + this.b.distance(f) === this.getDistance()) new Vector2(f.x + 1, f.y + 1)
      return
    }
    if (f instanceof Line) return this.toPoly().collision(f.toPoly())
    return f.collision(this)?.multiply(-1)
  }

  public toRect(): Rect {
    return new Rect(
      new Vector2(Math.min(this.a.x, this.b.x), Math.min(this.a.y, this.b.y)),
      new Vector2(Math.max(this.a.x, this.b.x), Math.max(this.a.y, this.b.y)))
  }
}
