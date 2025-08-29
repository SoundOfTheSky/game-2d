import ECSWorld from '@/ecs/world'

import Rodosskaya from '../maps/rodosskaya'
import AbilitiesSystem from '../systems/abilities/abilities.system'
import { AnimationSystem } from '../systems/animation.system'
import DestroySystem from '../systems/destroy.system'
import { InputSystem } from '../systems/input.system'
import MapSystem from '../systems/map.system'
import ParentSystem from '../systems/parent.system'
import PhysicsSystem from '../systems/physics.system'
import { RenderSystem } from '../systems/render.system'
import TransformSystem from '../systems/transform.system'
import TriggerAnimationSystem from '../systems/trigger-animation.system'
import UISystem from '../systems/ui/ui.system'

export default class DefaultWorld extends ECSWorld {
  public context: CanvasRenderingContext2D

  public constructor(
    public canvas: HTMLCanvasElement,
    public resources: Record<string, string | HTMLImageElement>,
  ) {
    super()
    this.context = this.canvas.getContext('2d')!

    // === Systems ===
    new InputSystem(this)
    new TransformSystem(this)
    new ParentSystem(this)
    new RenderSystem(this)
    new AnimationSystem(this)
    // new EffectsSystem(this)
    new PhysicsSystem(this)
    new MapSystem(this)
    new TriggerAnimationSystem(this)
    new UISystem(this)
    new AbilitiesSystem(this)
    new DestroySystem(this)
    // new DebugSystem(this)
    // new HPSystem(this)

    // === Map ===
    new Rodosskaya(this)
  }
}
