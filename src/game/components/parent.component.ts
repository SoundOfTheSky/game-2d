import ECSComponent from '@/game/ecs/component'

import ECSEntity from '../ecs/entity'

export type ParentComponentData = {
  entity: ECSEntity
  version: number
}
export class ParentComponent extends ECSComponent<ParentComponentData> {
  public constructor(world: ECSEntity, entity: ECSEntity) {
    super(world, {
      entity,
      version: entity.version,
    })
  }
}
