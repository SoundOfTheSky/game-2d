import ECSComponent from '@/game/ecs/component'

export type HPComponentData = {
  hp: number
  maxHP: number
  regen?: number
  regenCooldown?: number
  lastDamageTime?: number
}
export class HPComponent extends ECSComponent<HPComponentData> {}
