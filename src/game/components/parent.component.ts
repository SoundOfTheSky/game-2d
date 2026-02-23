import ECSComponent from '@/ecs/component'

import ECSEntity from '../../ecs/entity'

export type ParentComponentData = {
  entity: ECSEntity
  previous?: ECSEntity
}
/** Call setNewParent to update */
export class ParentComponent extends ECSComponent<ParentComponentData> {
  public constructor(world: ECSEntity, entity: ECSEntity) {
    super(world, {
      entity,
    })
  }

  public setNewParent(entity: ECSEntity) {
    this.data.previous = this.data.entity
    this.data.entity = entity
  }
}
