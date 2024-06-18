import Circle from './circle';
import Line from './line';
import Rect from './rect';
import Vector2 from './vector2';

import { IPhysicsBody, PhysicsBody } from '.';

export default class Poly extends Array<Vector2> implements IPhysicsBody {
  public collision(f: PhysicsBody): Vector2 | undefined {
    if (f instanceof Vector2) return this.collisionCircle(new Circle(f, 0));
    if (f instanceof Line) return this.collisionPoly(f.toPoly());
    if (f instanceof Rect) return this.collisionPoly(f.toPoly());
    if (f instanceof Circle) return this.collisionCircle(f);
    return this.collisionPoly(f);
  }

  public clone() {
    return new Poly(...super.map((x) => x.clone()));
  }

  public move(v: Vector2) {
    for (const p of this) p.move(v);
    return this;
  }

  public *toLines() {
    for (let i = 0, j = this.length - 1; i < this.length; j = i++) yield new Line(this[i].clone(), this[j].clone());
  }

  public toRect(): Rect {
    const a = new Vector2(Infinity, Infinity);
    const b = new Vector2(-Infinity, -Infinity);
    for (let i = 0; i < this.length; i++) {
      const p = this[i];
      if (p.x < a.x) a.x = p.x;
      if (p.y < a.y) a.y = p.y;
      if (p.x > b.x) b.x = p.x;
      if (p.y > b.y) b.y = p.y;
    }
    return new Rect(a, b);
  }

  public getAxes(axes: Vector2[] = []) {
    points: for (let i = 0, j = this.length - 1; i < this.length; j = i++) {
      const v = new Vector2(this[i].y - this[j].y, this[j].x - this[i].x).normalize();
      for (let i2 = 0; i2 < axes.length; i2++) if (v.equals(axes[i2])) continue points;
      axes.push(v);
    }
    return axes;
  }

  public project(axis: Vector2) {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < this.length; i++) {
      const p = this[i];
      const projection = axis.x * p.x + axis.y * p.y;
      if (projection < min) min = projection;
      if (projection > max) max = projection;
    }
    return [min, max] as const;
  }

  public collisionPoly(p: Poly) {
    const axes: Vector2[] = [];
    this.getAxes(axes);
    p.getAxes(axes);
    let minOverlap = Infinity;
    let minAxis!: Vector2;
    for (let i = 0; i < axes.length; i++) {
      const axis = axes[i];
      const [minA, maxA] = this.project(axis);
      const [minB, maxB] = p.project(axis);
      if (maxA <= minB || maxB <= minA) return;
      const overlap = minB < minA ? minA - maxB : maxA - minB;
      if (Math.abs(overlap) < Math.abs(minOverlap)) {
        minOverlap = overlap;
        minAxis = axis;
      }
    }
    return new Vector2(minAxis.x * minOverlap, minAxis.y * minOverlap);
  }

  public collisionCircle(c: Circle) {
    const axes: Vector2[] = [];
    this.getAxes(axes);
    let circleAxis!: Vector2;
    let minDistanceSqured = Infinity;
    for (let i = 0; i < this.length; i++) {
      const delta = new Vector2(this[i].x - c.c.x, this[i].y - c.c.y);
      const distanceSquared = delta.x * delta.x + delta.y * delta.y;
      if (distanceSquared < minDistanceSqured) {
        minDistanceSqured = distanceSquared;
        circleAxis = delta;
      }
    }
    circleAxis.normalize();
    axes.push(circleAxis);
    let minOverlap = Infinity;
    let minAxis!: Vector2;
    for (let i = 0; i < axes.length; i++) {
      const axis = axes[i];
      const [minA, maxA] = this.project(axis);
      const midB = axis.x * c.c.x + axis.y * c.c.y;
      const minB = midB - c.r;
      const maxB = midB + c.r;
      if (maxA <= minB || maxB <= minA) return;
      const overlap = minB < minA ? minA - maxB : maxA - minB;
      if (Math.abs(overlap) < Math.abs(minOverlap)) {
        minOverlap = overlap;
        minAxis = axis;
      }
    }
    return new Vector2(minAxis.x * minOverlap, minAxis.y * minOverlap);
  }
}
