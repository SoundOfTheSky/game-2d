import { ECSQuery } from '../ecs/query'
import { ECSSystem } from '../ecs/system'
import DefaultWorld from '../worlds/default.world'

export default class DebugSystem extends ECSSystem {
  declare public world: DefaultWorld
  public queue

  public constructor(world: DefaultWorld) {
    super(world)
    this.queue = new ECSQuery(world, ['debug'])
  }

  public tick(): void {
    for (const entity of this.queue.matches) {
      console.log(entity)
    }
  }
}
