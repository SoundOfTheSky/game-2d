import ECSComponent from '@/ecs/component'

import ECSEntity from '../../ecs/entity'
import Vector2 from '../../physics/body/vector2'

import { ParentComponent } from './parent.component'

export type TransformComponentData = {
  position: Vector2
  scale?: number
  rotation?: number
}
export class TransformComponent extends ECSComponent<TransformComponentData> {
  public constructor(
    entity: ECSEntity,
    data: Partial<TransformComponentData> = {},
  ) {
    data.position ??= new Vector2()
    super(entity, data as TransformComponentData)
  }
}

export class TransformParentComponent extends ParentComponent {}
