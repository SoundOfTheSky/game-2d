import { Optional } from '@softsky/utils'

import ECSComponent from '@/game/ecs/component'

import ECSEntity from '../ecs/entity'
import { ECSKey } from '../ecs/query'

import { Renderable } from './renderable.component'

export type AnimationFrame = Partial<Renderable> & {
  onDraw?: () => unknown
  time?: number
}
export type AnimationComponentData = {
  frames: AnimationFrame[]
  speed: number
  frame: number
  lastFrameChange?: number
  animationName?: ECSKey
  animations?: Record<ECSKey, AnimationFrame[]>
}

export class AnimationComponent extends ECSComponent<AnimationComponentData> {
  public constructor(entity: ECSEntity, data: Optional<AnimationComponentData, 'speed' | 'frame' | 'lastFrameChange' | 'frames'>) {
    data.speed ??= 1
    data.frame ??= 0
    if (!data.frames) {
      const animationName = data.animations && Object.keys(data.animations)[0]
      if (animationName) {
        data.animationName = animationName
        data.frames = data.animations![animationName]!
      }
      else data.frames = []
    }
    super(entity, data as AnimationComponentData)
  }

  public play(animation: ECSKey | AnimationFrame[]) {
    if (Array.isArray(animation)) {
      delete this.data.animationName
      this.data.frames = animation
    }
    else {
      this.data.animationName = animation
      this.data.frames = this.data.animations![animation]!
    }
    this.data.frame = 0
    delete this.data.lastFrameChange
  }

  public playIfNotPlaying(animationName: ECSKey) {
    if (this.data.animationName !== animationName) this.play(animationName)
  }
}
