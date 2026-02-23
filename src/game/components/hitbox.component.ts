import ECSComponent from '@/ecs/component'

import { PhysicsBody } from '../../math/body'
import Rect from '../../math/body/rect'
import Vector2 from '../../math/body/vector2'

export type HitboxComponentData = {
  body: PhysicsBody
  types: Set<string>
  worldBody?: PhysicsBody
  rect?: Rect
  onCollide?: (
    myHitbox: HitboxComponent,
    otherHitbox: HitboxComponent,
    separationVector: Vector2,
  ) => unknown
}
export class HitboxComponent extends ECSComponent<HitboxComponentData> {}
