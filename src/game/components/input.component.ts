import ECSComponent from '@/game/ecs/component'

import { ECSKey } from '../ecs/query'

import { AbilityComponent } from './ability.component'

export type InputComponentData = {
  move?: boolean
  look?: boolean
  actions?: Record<ECSKey, AbilityComponent>
}
export class InputComponent extends ECSComponent<InputComponentData> {}
