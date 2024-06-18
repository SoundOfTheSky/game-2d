import Player from '../entities/player';
import Game from '../game';
import Level, { TiledLevel, TyledObjectLayer } from '../level';
import { Ticker } from '../ticker';

export default class Rodosskaya extends Level {
  public constructor(game: Game, parent: Ticker, priority?: number) {
    const map = JSON.parse(game.resources['/game/maps/rodosskaya.json'] as string) as TiledLevel;
    map.tilesets = map.tilesets.map((tileset) => {
      tileset.sourceFile = game.resources[`/game/tilesets/${tileset.source.slice(12, -5)}.png`] as HTMLImageElement;
      tileset.columns = tileset.sourceFile.naturalWidth / map.tilewidth;
      return tileset;
    });

    super(game, parent, map, priority);
    const p = this.addEntity(new Player(game, this, 14));
    const spawn = (this.map.layers.find((layer) => layer.name === 'triggers') as TyledObjectLayer).objects.find(
      (obj) => obj.name === 'spawn',
    )!;
    p.pos.x = spawn.x;
    p.pos.y = spawn.y;
    this.cam.scale = 4 * window.devicePixelRatio;
    this.cam.pos.x = p.pos.x * this.cam.scale - this.game.canvas.width / 2;
    this.cam.pos.y = p.pos.y * this.cam.scale - this.game.canvas.height / 2;
    this.cam.followingEntity = p;
  }
}
