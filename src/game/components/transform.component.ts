import { Optional } from '@softsky/utils'

import ECSComponent from '@/ecs/component'
import ECSEntity from '@/ecs/entity'
import { Matrix4 } from '@/math/matrix4'
import { Vector3 } from '@/math/vector3'

export type TransformComponentData = {
  position: Vector3
  matrix: Matrix4
  scale?: Vector3
  rotation?: number
  pivotRotation?: number
}
export class TransformComponent extends ECSComponent<TransformComponentData> {
  public constructor(
    entity: ECSEntity,
    data: Optional<TransformComponentData, 'matrix'>,
  ) {
    data.matrix ??= new Matrix4()
    super(entity, data as TransformComponentData)
  }
}
