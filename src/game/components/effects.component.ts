import ECSComponent from '@/game/ecs/component'

import ECSEntity from '../ecs/entity'

export class EffectsComponent extends ECSComponent<Effect[]> {}

export class Effect {
  public startTime
  protected effectsComponent

  public constructor(public entity: ECSEntity, public duration: number) {
    this.startTime = entity.world.time
    this.effectsComponent = entity.components.get(EffectsComponent) ?? new EffectsComponent(entity, [])
    this.effectsComponent.data.push(this)
  }

  public update() {
    if (this.entity.world.time > this.startTime + this.duration) this.destroy()
  }

  public destroy() {
    this.effectsComponent.data.splice(this.effectsComponent.data.indexOf(this), 1)
  }
}
