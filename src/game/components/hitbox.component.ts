import ECSComponent from '@/game/ecs/component'

import { ECSKey } from '../ecs/query'
import { PhysicsBody } from '../systems/physics/body'
import Rect from '../systems/physics/body/rect'
import Vector2 from '../systems/physics/body/vector2'

export type HitboxComponentData = {
  body: PhysicsBody
  types: Set<ECSKey>
  worldBody?: PhysicsBody
  rect?: Rect
  onCollide?: (myHitbox: HitboxComponent, otherHitbox: HitboxComponent, separetionVector: Vector2) => unknown
}
export class HitboxComponent extends ECSComponent<HitboxComponentData> {}
