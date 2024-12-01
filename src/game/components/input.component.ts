import { Optional } from '@softsky/utils'

import ECSComponent from '@/game/ecs/component'

import ECSEntity from '../ecs/entity'

import { Ability } from './abilities.component'

export type InputComponentData = {
  move?: boolean
  look?: boolean
  actions: Record<string, Ability>
  startAction: Set<Ability>
  stopAction: Set<Ability>
}
export class InputComponent extends ECSComponent<InputComponentData> {
  public constructor(entity: ECSEntity, data: Optional<InputComponentData, 'startAction' | 'stopAction' | 'actions'>) {
    data.actions ??= {}
    data.startAction ??= new Set()
    data.stopAction ??= new Set()
    super(entity, data as InputComponentData)
  }
}
