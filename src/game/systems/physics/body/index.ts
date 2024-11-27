import Circle from './circle'
import Line from './line'
import Poly from './poly'
import Rect from './rect'
import Vector2 from './vector2'

export type PhysicsBody = Vector2 | Line | Rect | Circle | Poly
export type IPhysicsBody = {
  collision(f: PhysicsBody): Vector2 | undefined
  clone(): PhysicsBody
  toRect(): Rect
  add(v: Vector2): PhysicsBody
  subtract(v: Vector2 | number): PhysicsBody
  multiply(v: Vector2 | number): PhysicsBody
  devide(v: Vector2 | number): PhysicsBody
  rotate(angle: number, pivot?: Vector2): PhysicsBody
  center(): Vector2
  scale(v: Vector2 | number): PhysicsBody
}
