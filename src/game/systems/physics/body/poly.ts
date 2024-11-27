import Circle from './circle'
import Line from './line'
import Rect from './rect'
import Vector2 from './vector2'

import { IPhysicsBody, PhysicsBody } from '.'

export default class Poly extends Array<Vector2> implements IPhysicsBody {
  public center() {
    return new Vector2(super.reduce((sum, v) => sum + v.x, 0) / this.length, super.reduce((sum, v) => sum + v.y, 0) / this.length)
  }

  public rotate(angle: number, pivot = this.center()): PhysicsBody {
    for (let index = 0; index < this.length; index++)
      this[index]!.rotate(angle, pivot)
    return this
  }

  public scale(v: Vector2 | number) {
    const center = this.center()
    const scaleX = typeof v === 'number' ? v : v.x
    const scaleY = typeof v === 'number' ? v : v.y
    for (let index = 0; index < this.length; index++) {
      const p = this[index]!
      p.x = center.x + (p.x - center.x) * scaleX
      p.y = center.y + (p.y - center.y) * scaleY
    }
    return this
  }

  public add(v: Vector2) {
    for (let index = 0; index < this.length; index++)
      this[index]!.add(v)
    return this
  }

  public devide(v: Vector2 | number) {
    for (let index = 0; index < this.length; index++)
      this[index]!.devide(v)
    return this
  }

  public multiply(v: Vector2 | number) {
    for (let index = 0; index < this.length; index++)
      this[index]!.multiply(v)
    return this
  }

  public subtract(v: Vector2 | number) {
    for (let index = 0; index < this.length; index++)
      this[index]!.subtract(v)
    return this
  }

  public collision(f: PhysicsBody): Vector2 | undefined {
    if (f instanceof Vector2) return this.collisionCircle(new Circle(f, 0))
    if (f instanceof Line) return this.collisionPoly(f.toPoly())
    if (f instanceof Rect) return this.collisionPoly(f.toPoly())
    if (f instanceof Circle) return this.collisionCircle(f)
    return this.collisionPoly(f)
  }

  public clone() {
    return new Poly(...super.map(x => x.clone()))
  }

  public *toLines() {
    for (let index1 = 0, index2 = this.length - 1; index1 < this.length; index2 = index1++) yield new Line(this[index1]!.clone(), this[index2]!.clone())
  }

  public toRect(): Rect {
    const a = new Vector2(Infinity, Infinity)
    const b = new Vector2(-Infinity, -Infinity)
    for (let index = 0; index < this.length; index++) {
      const p = this[index]!
      if (p.x < a.x) a.x = p.x
      if (p.y < a.y) a.y = p.y
      if (p.x > b.x) b.x = p.x
      if (p.y > b.y) b.y = p.y
    }
    return new Rect(a, b)
  }

  public getAxes(axes: Vector2[] = []) {
    points: for (let index1 = 0, index2 = this.length - 1; index1 < this.length; index2 = index1++) {
      const v = new Vector2(this[index1]!.y - this[index2]!.y, this[index2]!.x - this[index1]!.x).normalize()
      for (let axeIndex = 0; axeIndex < axes.length; axeIndex++) if (v.equals(axes[axeIndex]!)) continue points
      axes.push(v)
    }
    return axes
  }

  public project(axis: Vector2) {
    let min = Infinity
    let max = -Infinity
    for (let index = 0; index < this.length; index++) {
      const p = this[index]!
      const projection = axis.x * p.x + axis.y * p.y
      if (projection < min) min = projection
      if (projection > max) max = projection
    }
    return [min, max] as const
  }

  public collisionPoly(p: Poly) {
    const axes: Vector2[] = []
    this.getAxes(axes)
    p.getAxes(axes)
    let minOverlap = Infinity
    let minAxis!: Vector2
    for (let index = 0; index < axes.length; index++) {
      const axis = axes[index]!
      const [minA, maxA] = this.project(axis)
      const [minB, maxB] = p.project(axis)
      if (maxA <= minB || maxB <= minA) return
      const overlap = minB < minA ? minA - maxB : maxA - minB
      if (Math.abs(overlap) < Math.abs(minOverlap)) {
        minOverlap = overlap
        minAxis = axis
      }
    }
    return new Vector2(minAxis.x * minOverlap, minAxis.y * minOverlap)
  }

  public collisionCircle(c: Circle) {
    const axes: Vector2[] = []
    this.getAxes(axes)
    let circleAxis!: Vector2
    let minDistanceSqured = Infinity
    for (let index = 0; index < this.length; index++) {
      const delta = new Vector2(this[index]!.x - c.c.x, this[index]!.y - c.c.y)
      const distanceSquared = delta.x * delta.x + delta.y * delta.y
      if (distanceSquared < minDistanceSqured) {
        minDistanceSqured = distanceSquared
        circleAxis = delta
      }
    }
    circleAxis.normalize()
    axes.push(circleAxis)
    let minOverlap = Infinity
    let minAxis!: Vector2
    for (let index = 0; index < axes.length; index++) {
      const axis = axes[index]!
      const [minA, maxA] = this.project(axis)
      const midB = axis.x * c.c.x + axis.y * c.c.y
      const minB = midB - c.r
      const maxB = midB + c.r
      if (maxA <= minB || maxB <= minA) return
      const overlap = minB < minA ? minA - maxB : maxA - minB
      if (Math.abs(overlap) < Math.abs(minOverlap)) {
        minOverlap = overlap
        minAxis = axis
      }
    }
    return new Vector2(minAxis.x * minOverlap, minAxis.y * minOverlap)
  }
}
