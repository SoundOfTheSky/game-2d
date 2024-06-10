import Poly from './poly';
import Rect from './rect';
import Vector2 from './vector2';

import { IPhysicsBody, PhysicsBody } from '.';

export default class Line implements IPhysicsBody {
  public constructor(
    public a: Vector2,
    public b: Vector2,
  ) {}

  public move(v: Vector2) {
    this.a.move(v);
    this.b.move(v);
    return this;
  }

  public clone() {
    return new Line(this.a.clone(), this.b.clone());
  }

  public getDistance() {
    return this.a.distance(this.b);
  }

  public toPoly() {
    return new Poly(this.a.clone(), this.b.clone());
  }

  public splitWithPoint(v: Vector2) {
    return [new Line(this.a.clone(), v.clone()), new Line(v.clone(), this.b.clone())] as const;
  }

  public collision(f: PhysicsBody): Vector2 | undefined {
    if (f instanceof Vector2) {
      if (this.a.distance(f) + this.b.distance(f) === this.getDistance()) new Vector2(f.x + 1, f.y + 1);
      return;
    }
    if (f instanceof Line) return this.toPoly().collision(f.toPoly());
    return f.collision(this)?.scaleN(-1);
  }
  public toRect(): Rect {
    return new Rect(this.a.clone(), this.b.clone());
  }
}
