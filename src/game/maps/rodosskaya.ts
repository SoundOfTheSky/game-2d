import { RenderSystem } from '../systems/render.system'
import DefaultWorld from '../worlds/default.world'

import Map from './map'

export default class Rodosskaya extends Map {
  public constructor(world: DefaultWorld) {
    super(world, 'rodosskaya')
    this.world.generatorSystem.push(this.zoomIn())
  }

  protected *zoomIn() {
    const renderSystem = this.world.systemMap.get(RenderSystem)!
    const targetZoom = 4 * window.devicePixelRatio
    while (renderSystem.zoom < targetZoom) {
      renderSystem.zoom *= 1.01
      yield
    }
  }
}
