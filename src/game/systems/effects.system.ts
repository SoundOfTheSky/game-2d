import { EffectsComponent } from '../components/effects.component'
import { ECSQuery } from '../../ecs/query'
import { ECSSystem } from '../../ecs/system'
import DefaultWorld from '../worlds/default.world'

export default class EffectsSystem extends ECSSystem {
  declare public world: DefaultWorld
  public queue

  public constructor(world: DefaultWorld) {
    super(world)
    this.queue = new ECSQuery(world, [EffectsComponent])
  }

  public tick(): void {
    for (const entity of this.queue.matches) {
      const effectsComponent = entity.components.get(EffectsComponent)!
      for (let index = 0; index < effectsComponent.data.length; index++)
        effectsComponent.data[index]!.tick()
    }
  }
}
