import ECSComponent from '@/game/ecs/component'

import ECSEntity from '../ecs/entity'
import Vector2 from '../systems/physics/body/vector2'

export type VelocityComponentData = {
  velocity: Vector2
  lastDirection: Vector2
  acceleration?: Vector2
  terminalVelocity?: number
}
export class VelocityComponent extends ECSComponent<VelocityComponentData> {
  public constructor(
    entity: ECSEntity,
    data: Partial<VelocityComponentData> = {},
  ) {
    data.velocity ??= new Vector2()
    data.lastDirection ??= new Vector2(0, 1)
    super(entity, data as VelocityComponentData)
  }

  public isZero() {
    return this.data.velocity.x === 0 && this.data.velocity.y === 0
  }
}

export function getDirectionStringFromVector2(v: Vector2) {
  if (Math.abs(v.y) > Math.abs(v.x)) {
    if (v.y > 0) return 'Down'
    return 'Up'
  }
  if (v.x > 0) return 'Right'
  return 'Left'
}
