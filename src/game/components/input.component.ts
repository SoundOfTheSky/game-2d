import { Optional } from '@softsky/utils'

import ECSComponent from '@/game/ecs/component'

import ECSEntity from '../ecs/entity'
import { Key } from '../systems/input.system'

import { Ability } from './abilities.component'

export type InputComponentData = {
  moveToVelocity?: boolean
  moveToAcceleration?: boolean
  abilities: Map<Key, Ability>
  startAbility: Set<Ability>
  stopAbility: Set<Ability>
}
export class InputComponent extends ECSComponent<InputComponentData> {
  public constructor(
    entity: ECSEntity,
    data: Optional<
      InputComponentData,
      'startAbility' | 'stopAbility' | 'abilities'
    >,
  ) {
    data.abilities ??= new Map()
    data.startAbility ??= new Set()
    data.stopAbility ??= new Set()
    super(entity, data as InputComponentData)
  }
}
