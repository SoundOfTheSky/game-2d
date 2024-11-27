import { TransformComponent } from '../components/transform.component'
import { VelocityComponent } from '../components/velocity.component'
import { ECSQuery } from '../ecs/query'
import { ECSSystem } from '../ecs/system'
import DefaultWorld from '../worlds/default.world'

export default class DebugSystem extends ECSSystem {
  public declare world: DefaultWorld
  public queue

  public constructor(world: DefaultWorld) {
    super(world)
    this.queue = new ECSQuery(world, ['debug'])
  }

  public update(): void {
    for (const entity of this.queue.matches) {
      const transformComponent = entity.components.get(TransformComponent)
      const velocityComponent = entity.components.get(VelocityComponent)
      console.log(transformComponent?.data.position.toString())
    }
  }
}
