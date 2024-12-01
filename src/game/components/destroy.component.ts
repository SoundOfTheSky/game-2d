import ECSComponent from '@/game/ecs/component'

import ECSEntity from '../ecs/entity'

export type DestroyComponentData = {
  time?: number
  custom?: (entity: ECSEntity) => boolean
}
export class DestroyComponent extends ECSComponent<DestroyComponentData> {}
