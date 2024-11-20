import AnimatedComponent from '../components/animated.component'
import RenderableComponent from '../components/renderable.component'
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
    this.queue = new ECSQuery(world, [AnimatedComponent, RenderableComponent])
  }

  public update(): void {
    for (const entity of this.queue.matches) {
      const renderableComponents = entity.components.get(AnimatedComponent)!
      for (let index = 0; index < renderableComponents.length; index++) {
        const component = renderableComponents[index]!
        let timeSinceLastChange = this.world.time - component.data.lastFrameChange
        let changed = false
        while (true) {
          const { time } = component.data.frames[component.data.frame]!
          if (!time) break
          timeSinceLastChange -= time / component.data.speed
          if (timeSinceLastChange <= 0) break
          if (++component.data.frame === component.data.frames.length) component.data.frame = 0
          changed = true
        }
        if (changed) {
          const frame = component.data.frames[component.data.frame]!
          frame.onDraw?.()
          component.data.lastFrameChange
            = this.world.time - (frame.time ?? 0)
            / component.data.speed - timeSinceLastChange
          // Object.assign(this, frame)
        }
      }
    }
  }
}
