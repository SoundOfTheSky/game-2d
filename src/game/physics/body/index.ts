import Circle from './circle';
import Line from './line';
import Poly from './poly';
import Rect from './rect';
import Vector2 from './vector2';

export type PhysicsBody = Vector2 | Line | Rect | Circle | Poly;
export type IPhysicsBody = {
  collision(f: PhysicsBody): Vector2 | undefined;
  move(v: Vector2): PhysicsBody;
  clone(): PhysicsBody;
  toRect(): Rect;
};
