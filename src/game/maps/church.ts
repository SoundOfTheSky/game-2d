import { RenderSystem } from '../systems/render.system'
import DefaultWorld from '../worlds/default.world'

import Map from './map'

export class Church extends Map {
  public constructor(world: DefaultWorld) {
    super(world, 'church')
    const renderSystem = this.world.systemMap.get(RenderSystem)!
    renderSystem.zoom = 2 * window.devicePixelRatio
  }
}
