import ECSWorld from '@/ecs/world'
import { Matrix4 } from '@/math/matrix4'

import { ECSQuery } from '../../ecs/query'
import { ECSSystem } from '../../ecs/system'
import { RenderableComponent } from '../components/renderable.component'
import { TransformComponent } from '../components/transform.component'

export default class RenderSystem extends ECSSystem {
  public matrix = new Matrix4()
  public queue

  public constructor(world: ECSWorld) {
    super(world)
    this.queue = new ECSQuery(world, [TransformComponent, RenderableComponent])
  }

  public tick(): void {
    for (const entity of this.queue.entities) {
      const transformComponent = entity.components.get(TransformComponent)!
      const renderableComponent = entity.components.get(RenderableComponent)!
      const m = this.matrix
      m.identity()
      if (transformComponent.data.rotation)
        m.rotateZ(transformComponent.data.rotation)
      if (transformComponent.data.scale) m.scale(transformComponent.data.scale)
      m.translate(transformComponent.data.position)
      if (transformComponent.data.pivotRotation)
        m.rotateZ(transformComponent.data.pivotRotation)
    }
  }
}
