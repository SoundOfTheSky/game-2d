import ECSComponent from '@/game/ecs/component'

import { Renderable } from './renderable.component'

export type AnimationFrame = Renderable & {
  onDraw?: () => unknown
  time?: number
}
export type AnimatedComponentData = {
  frames: AnimationFrame[]
  speed: number
  frame: number
  lastFrameChange: number
}

export default class AnimatedComponent extends ECSComponent<AnimatedComponentData> {}
