import Vector2 from '../../physics/body/vector2'
import createPlayer from '../entities/player.entity'
import MapSystem, { TiledMap, TyledObjectLayer } from '../systems/map.system'
import { StreamingSystem } from '../systems/streaming.system'
import UISystem from '../systems/ui/ui.system'
import DefaultWorld from '../worlds/default.world'

export default class Map {
  protected mapSystem: MapSystem
  protected streamingSystem: StreamingSystem

  public constructor(
    public world: DefaultWorld,
    public name: string,
  ) {
    this.mapSystem = world.systemMap.get(MapSystem)!
    this.streamingSystem = world.systemMap.get(StreamingSystem)!
    this.world.generatorSystems.push(this.load())
  }

  protected *load() {
    this.world.systemMap
      .get(UISystem)!
      .printValues.set('Loading', 'Map: ' + this.name)
    let map
    while (!map) {
      map = this.streamingSystem.getResource(`/game/maps/${this.name}.tmj`) as
        | TiledMap
        | undefined
      yield
    }

    for (const tileset of map.tilesets)
      while (
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        !(tileset.sourceFile = this.streamingSystem.getResource(
          `/game${tileset.source.slice(2, -3)}webp`,
        ) as HTMLImageElement)
      )
        yield

    for (const tileset of map.tilesets)
      tileset.columns = tileset.sourceFile.naturalWidth / map.tilewidth

    while (!this.streamingSystem.getResource('/game/mc.webp')) yield

    const spawn = (
      map.layers.find((layer) => layer.name === 'triggers') as TyledObjectLayer
    ).objects.find((object) => object.name === 'spawn')
    createPlayer(this.world, {
      position: new Vector2(spawn?.x, spawn?.y),
    })
    this.mapSystem.tiledDefinition = map
    this.world.systemMap.get(UISystem)!.printValues.delete('Loading')
  }
}
