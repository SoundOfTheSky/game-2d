import { ParentComponent } from '../components/parent.component'
import {
  TransformComponent,
  TransformComponentData,
  TransformParentComponent,
} from '../components/transform.component'
import { ECSQuery } from '../ecs/query'
import { ECSSystem } from '../ecs/system'
import DefaultWorld from '../worlds/default.world'

export default class TransformSystem extends ECSSystem {
  public declare world: DefaultWorld
  public priority = 99
  public queue
  private offsetMap = new Map<ParentComponent, TransformComponentData>()

  public constructor(world: DefaultWorld) {
    super(world)
    this.queue = new ECSQuery(world, {
      all: [TransformComponent],
      any: [TransformParentComponent, ParentComponent],
    })
  }

  public update(): void {
    for (const entity of this.queue.deleted)
      this.offsetMap.delete(entity.components.get(TransformParentComponent)
        ?? entity.components.get(ParentComponent)!)
    for (const entity of this.queue.matches) {
      const transformComponent = entity.components.get(TransformComponent)!
      const parentComponent
        = entity.components.get(TransformParentComponent)
        ?? entity.components.get(ParentComponent)!
      const parentTransformComponent
        = parentComponent.data.entity.components.get(TransformComponent)!
      if (this.queue.added.has(entity)) {
        const data: TransformComponentData = {
          position: transformComponent.data.position
            .clone()
            .subtract(parentTransformComponent.data.position),
        }
        if (
          transformComponent.data.rotation
          || parentTransformComponent.data.rotation
        ) {
          transformComponent.data.rotation ??= 0
          parentTransformComponent.data.rotation ??= 0
          data.rotation
            = transformComponent.data.rotation
            - parentTransformComponent.data.rotation
        }
        if (
          transformComponent.data.scale
          || parentTransformComponent.data.scale
        ) {
          transformComponent.data.scale ??= 1
          parentTransformComponent.data.scale ??= 1
          data.rotation
            = transformComponent.data.scale - parentTransformComponent.data.scale
        }
        this.offsetMap.set(parentComponent, data)
      }
      else {
        const offset = this.offsetMap.get(parentComponent)!
        transformComponent.data.position.x
          = parentTransformComponent.data.position.x + offset.position.x
        transformComponent.data.position.y
          = parentTransformComponent.data.position.y + offset.position.y
        if (offset.rotation)
          transformComponent.data.rotation
            = parentTransformComponent.data.rotation! + offset.rotation
        if (offset.scale)
          transformComponent.data.rotation
            = parentTransformComponent.data.scale! + offset.scale
      }
    }
  }
}
