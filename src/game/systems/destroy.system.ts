import { DestroyComponent } from '../components/destroy.component'
import { ECSQuery } from '../ecs/query'
import { ECSSystem } from '../ecs/system'
import DefaultWorld from '../worlds/default.world'

export default class DestroySystem extends ECSSystem {
  public declare world: DefaultWorld
  public queue$

  public constructor(world: DefaultWorld) {
    super(world)
    this.queue$ = new ECSQuery(world, [DestroyComponent])
  }

  public update(): void {
    for (const entity of this.queue$.matches) {
      const destroyComponent = entity.components.get(DestroyComponent)!
      if (
        (destroyComponent.data.time
          && this.world.time - entity.created > destroyComponent.data.time)
        || destroyComponent.data.custom?.(entity)
      )
        entity.destroy()
    }
  }
}
