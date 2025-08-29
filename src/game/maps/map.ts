import createPlayer from '../entities/player.entity'
import MapSystem, { TiledMap, TyledObjectLayer } from '../systems/map.system'
import Vector2 from '../../physics/body/vector2'
import DefaultWorld from '../worlds/default.world'

export default class Map {
  public mapSystem: MapSystem
  public constructor(
    public world: DefaultWorld,
    public name: string,
    playerSpawnName = 'spawn',
  ) {
    this.mapSystem = world.systemMap.get(MapSystem)!
    const map = JSON.parse(
      this.world.resources[`/game/maps/${name}.json`] as string,
    ) as TiledMap
    map.tilesets = map.tilesets.map((tileset) => {
      tileset.sourceFile = this.world.resources[
        `/game/tilesets/${tileset.source.slice(12, -5)}.png`
      ] as HTMLImageElement
      tileset.columns = tileset.sourceFile.naturalWidth / map.tilewidth
      return tileset
    })
    this.mapSystem.tiledDefinition = map

    const spawn = (
      map.layers.find((layer) => layer.name === 'triggers') as TyledObjectLayer
    ).objects.find((object) => object.name === playerSpawnName)
    createPlayer(this.world, {
      position: new Vector2(spawn?.x, spawn?.y),
    })
  }
}
