import Player from '../entities/player';
import Game from '../game';
import Level, { TiledLevel, TyledObjectLayer } from '../level';
import { Ticker } from '../ticker';

export default class Rodosskaya extends Level {
  private constructor(game: Game, parent: Ticker, map: TiledLevel, priority?: number) {
    super(game, parent, map, priority);
    const p = this.addTickable(new Player(game, this, 14));
    const spawn = (this.map.layers.find((layer) => layer.type === 'objectgroup') as TyledObjectLayer).objects.find(
      (obj) => obj.name === 'spawn',
    )!;
    p.pos.x = spawn.x;
    p.pos.y = spawn.y;
    this.cam.scale = 8;
    this.cam.entities.push(p);
    this.cam.pos.x = p.pos.x * this.cam.scale - this.game.canvas.width / 2;
    this.cam.pos.y = p.pos.y * this.cam.scale - this.game.canvas.height / 2;
    this.cam.followingEntity = p;
    this.physics.addEntity(p);
  }

  public static async create(game: Game, parent: Ticker, priority?: number) {
    const map = (await fetch(`/game/maps/rodosskaya.json`).then((x) => x.json())) as TiledLevel;
    map.tilesets = await Promise.all(
      map.tilesets.map(async (tileset) => {
        tileset.sourceFile = await Game.loadImage(`/game/tilesets/${tileset.source.slice(12, -5)}.png`);
        tileset.columns = tileset.sourceFile.naturalWidth / map.tilewidth;
        return tileset;
      }),
    );
    return new Rodosskaya(game, parent, map, priority);
  }
}
