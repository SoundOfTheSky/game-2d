import { ECSQuery } from '../../ecs/query'
import { ECSSystem } from '../../ecs/system'
import Vector2 from '../../physics/body/vector2'
import {
  AnimationComponent,
  AnimationFrame,
} from '../components/animated.component'
import { RenderableComponent } from '../components/renderable.component'
import DefaultWorld from '../worlds/default.world'

export class AnimationSystem extends ECSSystem {
  declare public world: DefaultWorld
  public queue

  public constructor(world: DefaultWorld) {
    super(world)
    this.queue = new ECSQuery(world, [AnimationComponent])
  }

  public tick(): void {
    for (const entity of this.queue.matches) {
      const animatedComponent = entity.components.get(AnimationComponent)!
      const renderableComponent =
        entity.components.get(RenderableComponent) ??
        new RenderableComponent(entity, {
          source: animatedComponent.data.frames[0]!.source!,
          offset: animatedComponent.data.frames[0]!.offset,
          size: animatedComponent.data.frames[0]!.size,
        })
      let changed = !animatedComponent.data.lastFrameChange
      let timeSinceLastChange = 0
      if (animatedComponent.data.lastFrameChange) {
        timeSinceLastChange =
          this.world.time - animatedComponent.data.lastFrameChange
        while (true) {
          const { time } =
            animatedComponent.data.frames[animatedComponent.data.frame]!
          if (!time) break
          timeSinceLastChange -= time / animatedComponent.data.speed
          // console.log(animatedComponent.data.frame, time, timeSinceLastChange)
          if (timeSinceLastChange <= 0) break
          if (
            ++animatedComponent.data.frame ===
            animatedComponent.data.frames.length
          )
            animatedComponent.data.frame = 0
          changed = true
        }
      }
      if (changed) {
        const frame =
          animatedComponent.data.frames[animatedComponent.data.frame]!
        frame.onDraw?.()
        animatedComponent.data.lastFrameChange =
          this.world.time -
          (frame.time ?? 0) / animatedComponent.data.speed -
          timeSinceLastChange
        Object.assign(renderableComponent.data, frame)
      }
    }
  }
}

export function generateAnimation(
  source: HTMLImageElement,
  row: number,
  length: number,
  size = new Vector2(32, 32),
  interval = 120,
  infinite = true,
) {
  const frames: Partial<AnimationFrame>[] = []
  const y = row * size.y
  for (let index = 0; index < length; index++) {
    const frame: Partial<AnimationFrame> = {
      offset: new Vector2(size.x * index, y),
    }
    if (index === 0) {
      frame.source = source
      frame.size = size
    }
    if (index !== length - 1 || infinite) frame.time = interval
    frames.push(frame)
  }
  return frames
}
