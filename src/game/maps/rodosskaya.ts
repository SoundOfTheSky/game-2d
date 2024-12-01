import { RenderSystem } from '../systems/render.system'
import DefaultWorld from '../worlds/default.world'

import Map from './map'

export default class Rodosskaya extends Map {
  public constructor(world: DefaultWorld) {
    super(world, 'rodosskaya')
    const renderSystem = this.world.systemMap.get(RenderSystem)!
    renderSystem.zoom = 4 * window.devicePixelRatio
  }
}
