import { removeFromArray } from '@softsky/utils'

import ECSComponent from '@/ecs/component'

export class EffectsComponent extends ECSComponent<Effect[]> {}

export class Effect {
  public startTime

  public constructor(
    protected effectsComponent: EffectsComponent,
    public duration: number,
  ) {
    this.startTime = this.effectsComponent.entity.world.time
    this.effectsComponent.data.push(this)
  }

  public tick() {
    if (
      this.effectsComponent.entity.world.time >
      this.startTime + this.duration
    )
      this.destroy()
  }

  public destroy() {
    removeFromArray(this.effectsComponent.data, this)
  }
}
