import Rect from './rect';

import { IPhysicsBody, PhysicsBody } from '.';

export default class Vector2 implements IPhysicsBody {
  public constructor(
    public x = 0,
    public y = 0,
  ) {}

  public move(v: Vector2) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  public clone() {
    return new Vector2(this.x, this.y);
  }

  public distance(v: Vector2) {
    return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2);
  }

  public collision(f: PhysicsBody): Vector2 | undefined {
    if (f instanceof Vector2) {
      if (f.x === this.x && f.y === this.y) new Vector2(this.x + 1, this.y);
      return;
    }
    return f.collision(this)?.scaleN(-1);
  }

  public toRect(): Rect {
    return new Rect(this.clone(), this.clone());
  }

  public subtract(v: Vector2) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  public scale(v: Vector2) {
    this.x *= v.x;
    this.y *= v.y;
    return this;
  }

  public scaleN(n: number) {
    this.x *= n;
    this.y *= n;
    return this;
  }

  public normalize(onlyDecrease?: boolean): Vector2 {
    const d = Math.sqrt(this.x * this.x + this.y * this.y);
    if (onlyDecrease ? d > 1 : d !== 0) {
      this.x /= d;
      this.y /= d;
    }
    return this;
  }

  public equals(v: Vector2) {
    return this.x === v.x && this.y === v.y;
  }
}
