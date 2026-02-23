import ECSComponent from '@/ecs/component'
import { Vector3 } from '@/math/vector3'

import { ParentComponent } from './parent.component'

export type TransformComponentData = {
  position: Vector3
  scale?: Vector3
  rotation?: number
  pivotRotation?: number
  matrix?: number
}
export class TransformComponent extends ECSComponent<TransformComponentData> {}

export class TransformParentComponent extends ParentComponent {}
