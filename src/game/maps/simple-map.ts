import Player from '../entities/player'
import Game from '../game'

import Map, { TiledMap, TyledObjectLayer } from './map'

export default class SimpleMap extends Map {
  public constructor(
    game: Game,
    public name: string,
    playerSpawnName = 'spawn',
    priority?: number,
  ) {
    const map = JSON.parse(game.resources[`/game/maps/${name}.json`] as string) as TiledMap
    map.tilesets = map.tilesets.map((tileset) => {
      tileset.sourceFile = game.resources[`/game/tilesets/${tileset.source.slice(12, -5)}.png`] as HTMLImageElement
      tileset.columns = tileset.sourceFile.naturalWidth / map.tilewidth
      return tileset
    })

    super(game, map, priority)
    const p = new Player(game, 14)
    const spawn = (this.map.layers.find(layer => layer.name === 'triggers') as TyledObjectLayer).objects.find(
      object => object.name === playerSpawnName,
    )
    p.pos.x = spawn?.x ?? 0
    p.pos.y = spawn?.y ?? 0
    this.addEntity(p)
    this.cam.scale = 4 * window.devicePixelRatio
    this.cam.pos.x = p.pos.x * this.cam.scale - this.game.canvas.width / 2
    this.cam.pos.y = p.pos.y * this.cam.scale - this.game.canvas.height / 2
    this.cam.followingEntities.push(p)
  }
}
