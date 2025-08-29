import ECSWorld from '@/ecs/world'

import { AnimationSystem } from '../systems/animation.system'
import DebugSystem from '../systems/debug.system'
import DestroySystem from '../systems/destroy.system'
import ParentSystem from '../systems/parent.system'
import { RenderSystem } from '../systems/render.system'
import TransformSystem from '../systems/transform.system'
import TriggerAnimationSystem from '../systems/trigger-animation.system'
import UISystem from '../systems/ui/ui.system'

export default class MobileWorld extends ECSWorld {
  public context: CanvasRenderingContext2D

  public constructor(
    public canvas: HTMLCanvasElement,
    public resources: Record<string, string | HTMLImageElement>,
  ) {
    super()
    this.context = this.canvas.getContext('2d')!

    // === Systems ===
    new TransformSystem(this)
    new ParentSystem(this)
    new RenderSystem(this)
    new AnimationSystem(this)
    new TriggerAnimationSystem(this)
    new UISystem(this)
    new DestroySystem(this)
    new DebugSystem(this)
  }
}
