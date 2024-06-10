import Cam from './cam';
import Entity from './entities/entity';
import Game from './game';
import Circle from './physics/body/circle';
import Line from './physics/body/line';
import Poly from './physics/body/poly';
import Rect from './physics/body/rect';
import Vector2 from './physics/body/vector2';
import Physics from './physics/physics';
import { Ticker } from './ticker';

export type TiledLevel = {
  width: number; // tiles
  height: number;
  tilewidth: number;
  tileheight: number;
  tilesets: {
    firstgid: number;
    source: string;
    sourceFile: HTMLImageElement;
    columns: number;
  }[];
  layers: (TyledTyleLayer | TyledObjectLayer)[];
};

export type TyledTyleLayer = {
  name: string;
  type: 'tilelayer';
  data: number[];
};

export type TyledObjectLayer = {
  name: string;
  type: 'objectgroup';
  objects: {
    name: string;
    x: number;
    y: number;
    height: number;
    width: number;
    ellipse?: boolean;
    polygon?: { x: number; y: number }[];
  }[];
};

export default class Level extends Ticker {
  public cam;
  public physics;

  public constructor(
    protected game: Game,
    parent: Ticker,
    public map: TiledLevel,
    priority = 100,
  ) {
    super(parent, priority);
    this.cam = new Cam(game, this);
    this.cam.max.x = this.map.width * this.map.tilewidth;
    this.cam.max.y = this.map.height * this.map.tileheight;
    this.physics = new Physics([this.createCollisionEnity()], this, this.cam.max, 1);
  }

  public tick(deltaTime: number): void {
    this.cam.tick();
    this.physics.tick(deltaTime);
    this.renderMap(0, 3);
    super.tick(deltaTime);
    this.renderMap(4, this.map.layers.length - 1);
  }

  protected createCollisionEnity() {
    const collision = this.addTickable(new Entity<undefined, undefined>(this.game, this, undefined));
    collision.name = 'collission';
    for (const layer of this.map.layers) {
      if (layer.type !== 'objectgroup') continue;
      for (const obj of layer.objects) {
        if (obj.name) continue;
        if (obj.ellipse)
          collision.hitboxes.push(
            new Circle(new Vector2(~~(obj.x + obj.width / 2), ~~(obj.y + obj.width / 2)), obj.width / 2),
          );
        else if (obj.polygon)
          collision.hitboxes.push(new Poly(...obj.polygon.map((p) => new Vector2(obj.x + p.x, obj.y + p.y))));
        else
          collision.hitboxes.push(
            new Rect(new Vector2(obj.x, obj.y), new Vector2(obj.x + obj.width, obj.y + obj.height)),
          );
      }
    }
    collision.hitboxes.push(new Line(new Vector2(), new Vector2(this.cam.max.x)));
    collision.hitboxes.push(new Line(new Vector2(), new Vector2(0, this.cam.max.y)));
    collision.hitboxes.push(new Line(new Vector2(this.cam.max.x), this.cam.max));
    collision.hitboxes.push(new Line(new Vector2(0, this.cam.max.y), this.cam.max));
    return collision;
  }

  protected renderMap(minLayer: number, maxLayer: number) {
    for (let i = minLayer; i <= maxLayer; i++) {
      const layer = this.map.layers[i];
      if (layer.type === 'tilelayer') {
        for (let j = 0; j < layer.data.length; j++) {
          const id = layer.data[j];
          if (id === 0) continue;
          const dw = ~~(this.map.tilewidth * this.cam.scale);
          const x = ~~(j % this.map.width) * dw - this.cam.pos.x;
          if (x < -dw || x > this.game.canvas.width) continue;
          const dh = ~~(this.map.tileheight * this.cam.scale);
          const y = ~~(j / this.map.width) * dh - this.cam.pos.y;
          if (y < -dh || y > this.game.canvas.height) continue;
          const tileset = this.map.tilesets.findLast((t) => t.firstgid <= id)!;
          const tId = id - tileset.firstgid;
          this.game.ctx.drawImage(
            tileset.sourceFile,
            (tId % tileset.columns) * this.map.tilewidth,
            ~~(tId / tileset.columns) * this.map.tileheight,
            this.map.tilewidth,
            this.map.tileheight,
            x,
            y,
            dw,
            dh,
          );
        }
      }
    }
  }
}
