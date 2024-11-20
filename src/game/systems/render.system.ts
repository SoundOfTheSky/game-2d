import RenderableComponent from '../components/renderable.component'
import { TransformComponent } from '../components/transform.component'
import { ECSQuery } from '../ecs/query'
import { ECSSystem } from '../ecs/system'
import DefaultWorld from '../worlds/default.world'

export default class RenderSystem extends ECSSystem {
  declare public world: DefaultWorld
  public queue

  public constructor(
    world: DefaultWorld,
  ) {
    super(world)
    this.queue = new ECSQuery(world, [RenderableComponent])
  }

  public update(): void {
    for (const entity of this.queue.matches) {
      const renderableComponent = entity.components.get(RenderableComponent)!
      let transformComponent = entity.components.get(TransformComponent)
      if (!transformComponent)
        transformComponent = new TransformComponent(entity)

      this.world.context.drawImage(
        renderableComponent.data.source,
        renderableComponent.data.offset?.x ?? 0,
        renderableComponent.data.offset?.y ?? 0,
        renderableComponent.data.size.x,
        renderableComponent.data.size.y,
        transformComponent.data.position.x,
        transformComponent.data.position.y,
        renderableComponent.data.size.x * (transformComponent.data.scale ?? 1),
        renderableComponent.data.size.y * (transformComponent.data.scale ?? 1),
      )
    }
  }
}
