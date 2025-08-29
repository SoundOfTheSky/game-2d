import Line from './line'
import Poly from './poly'
import Vector2 from './vector2'

import { IPhysicsBody, PhysicsBody } from '.'

export default class Rect implements IPhysicsBody {
  public constructor(
    public a = new Vector2(),
    public b = new Vector2(),
  ) {}

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

  public rotate(angle: number, pivot = this.center()) {
    const poly = this.toPoly()
    for (let index = 0; index < poly.length; index++)
      poly[index]!.rotate(angle, pivot)
    return poly
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

  public center() {
    return new Vector2((this.a.x + this.b.x) / 2, (this.a.y + this.b.y) / 2)
  }

  public collision(f: PhysicsBody): Vector2 | undefined {
    if (f instanceof Vector2) return this.collisonVector(f)
    if (f instanceof Line) return this.toPoly().collision(f.toPoly())
    if (f instanceof Rect) return this.collisionRect(f)
    return f.collision(this)?.multiply(-1)
  }

  public collisonVector(f: Vector2) {
    if (
      f.y >= this.a.y &&
      f.y <= this.b.y &&
      f.x >= this.a.x &&
      f.x <= this.b.x
    ) {
      const overlapX = f.x < this.a.x ? this.a.x - f.x : this.b.x - f.x
      const overlapY = f.y < this.a.y ? this.a.y - f.y : this.b.y - f.y
      return Math.abs(overlapX) < Math.abs(overlapY)
        ? new Vector2(overlapX)
        : new Vector2(0, overlapY)
    }
  }

  public collisionRect(f: Rect) {
    if (
      f.a.x <= this.b.x &&
      f.a.y <= this.b.y &&
      f.b.x >= this.a.x &&
      f.b.y >= this.a.y
    ) {
      const overlapX = f.a.x < this.a.x ? this.a.x - f.b.x : this.b.x - f.a.x
      const overlapY = f.a.y < this.a.y ? this.a.y - f.b.y : this.b.y - f.a.y
      return Math.abs(overlapX) < Math.abs(overlapY)
        ? new Vector2(overlapX)
        : new Vector2(0, overlapY)
    }
  }

  public intersectRect(f: Rect) {
    return (
      f.a.x <= this.b.x &&
      f.a.y <= this.b.y &&
      f.b.x >= this.a.x &&
      f.b.y >= this.a.y
    )
  }

  public contains(f: Rect) {
    return (
      this.a.x <= f.a.x &&
      this.b.x >= f.b.x &&
      this.a.y <= f.a.y &&
      this.b.y >= f.b.y
    )
  }

  public add(v: Vector2): this {
    this.a.add(v)
    this.b.add(v)
    return this
  }

  public get w() {
    return this.b.x - this.a.x
  }

  public get h() {
    return this.b.y - this.a.y
  }

  public clone() {
    return new Rect(this.a.clone(), this.b.clone())
  }

  public toPoints() {
    return [
      this.a.clone(),
      new Vector2(this.b.x, this.a.y),
      this.b.clone(),
      new Vector2(this.a.x, this.b.y),
    ]
  }

  public toPoly() {
    return new Poly(...this.toPoints())
  }

  public toLines() {
    const [a, b, c, d] = this.toPoints() as [Vector2, Vector2, Vector2, Vector2]
    return [
      new Line(a, b.clone()),
      new Line(b, c.clone()),
      new Line(c, d.clone()),
      new Line(d, a.clone()),
    ] as const
  }

  public toRect(): Rect {
    return this.clone()
  }

  public extend(rect: Rect) {
    if (rect.a.x < this.a.x) this.a.x = rect.a.x
    if (rect.a.y < this.a.y) this.a.y = rect.a.y
    if (rect.b.x > this.b.x) this.b.x = rect.b.x
    if (rect.b.y > this.b.y) this.b.y = rect.b.y
    return this
  }

  public area() {
    return this.w * this.h
  }

  public margin() {
    return this.w + this.h
  }

  public intersection(rect: Rect) {
    if (!this.intersectRect(rect)) return
    const r = this.clone()
    if (rect.a.x > r.a.x) r.a.x = rect.a.x
    if (rect.a.y > r.a.y) r.a.y = rect.a.y
    if (rect.b.x < r.b.x) r.b.x = rect.b.x
    if (rect.b.y < r.b.y) r.b.y = rect.b.y
    return r
  }

  public enlargedArea(rect: Rect) {
    return (
      Math.max(this.b.x, rect.b.x) -
      Math.min(this.a.x, rect.a.x) * Math.max(this.b.y, rect.b.y) -
      Math.min(this.a.y, rect.a.y)
    )
  }

  public equals(rect: Rect) {
    return (
      this.a.x === rect.a.x &&
      this.a.y === rect.a.y &&
      this.b.x === rect.b.x &&
      this.b.y === rect.b.y
    )
  }

  public toString() {
    return `Rect<${this.a.x}, ${this.a.y}, ${this.b.x}, ${this.b.y}>`
  }
}
