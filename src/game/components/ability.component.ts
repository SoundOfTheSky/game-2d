import ECSComponent from '@/game/ecs/component'

import { ECSKey } from '../ecs/query'

export type AbilityComponentData = {
  key: ECSKey
  triggerInput: ECSKey
  lastExecutionTime: number
  cooldown?: number
  uses?: number
  restoreUseTime?: number
  execute?: (component: AbilityComponent) => unknown
}
export class AbilityComponent extends ECSComponent<AbilityComponentData> {}
