import { ECSQuery } from '../../ecs/query'
import { ECSSystem } from '../../ecs/system'
import { ParentComponent } from '../components/parent.component'
import {
  TransformComponent,
  TransformParentComponent,
} from '../components/transform.component'
import DefaultWorld from '../worlds/default.world'

export default class TransformSystem extends ECSSystem {
  public priority = 99
  public queue

  public constructor(world: DefaultWorld) {
    super(world)
    this.queue = new ECSQuery(world, {
      all: [TransformComponent],
      any: [TransformParentComponent, ParentComponent],
    })
  }

  public tick(): void {
    for (const entity of this.queue.entities) {
      const transformComponent = entity.components.get(TransformComponent)!
      const parentComponent =
        entity.components.get(TransformParentComponent) ??
        entity.components.get(ParentComponent)!
      const parentTransformComponent =
        parentComponent.data.entity.components.get(TransformComponent)!
    }
  }
}
