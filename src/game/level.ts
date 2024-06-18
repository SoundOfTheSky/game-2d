import Cam from './cam';
import Entity from './entities/entity';
import Game from './game';
import Roads from './mechanics/roads';
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
    polyline?: [{ x: number; y: number }, { x: number; y: number }];
  }[];
};

export default class Level extends Ticker {
  public prerenderedLayers: HTMLCanvasElement[] = [];
  public cam;
  public physics;
  public roads?: Roads;

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
    this.createRoads();
    this.updateMap();
  }

  public tick(deltaTime: number): void {
    this.cam.tick();
    this.physics.tick(deltaTime);
    this.tickables.sort((a, b) => (a instanceof Entity ? a.pos.y : 0) - (b instanceof Entity ? b.pos.y : 0));
    const x = this.cam.pos.x / this.cam.scale;
    const y = this.cam.pos.y / this.cam.scale;
    const dx = this.game.canvas.width / this.cam.scale;
    const dy = this.game.canvas.height / this.cam.scale;
    for (let i = 0; i < this.prerenderedLayers.length; i++) {
      if (i === 3)
        for (let i = 0; i < this.tickables.length; i++) {
          const item = this.tickables[i];
          if (item instanceof Entity) item.tick(deltaTime);
        }
      const layer = this.prerenderedLayers[i];
      this.game.ctx.drawImage(layer, x, y, dx, dy, 0, 0, this.game.canvas.width, this.game.canvas.height);
    }
    for (let i = 0; i < this.tickables.length; i++) {
      const item = this.tickables[i];
      if (!(item instanceof Entity)) item.tick(deltaTime);
    }
  }

  public addEntity(entity: Entity) {
    this.addTickable(entity);
    this.cam.entities.push(entity);
    this.physics.addEntity(entity);
    return entity;
  }

  public removeEntity(entity: Entity) {
    this.removeTickable(entity);
    this.cam.entities.splice(this.cam.entities.indexOf(entity), 1);
    this.physics.removeEntity(entity);
  }

  public updateMap() {
    this.prerenderedLayers = [];
    for (let i = 0; i <= this.map.layers.length; i++) {
      const layer = this.map.layers[i];
      if (layer.type !== 'tilelayer') break;
      const canvas = document.createElement('canvas');
      this.prerenderedLayers.push(canvas);
      const { ctx } = Game.initCanvas(
        canvas,
        this.map.width * this.map.tilewidth,
        this.map.height * this.map.tileheight,
      );
      for (let j = 0; j < layer.data.length; j++) {
        const id = layer.data[j];
        if (id === 0) continue;
        const tileset = this.map.tilesets.findLast((t) => t.firstgid <= id)!;
        const tId = id - tileset.firstgid;
        ctx.drawImage(
          tileset.sourceFile,
          (tId % tileset.columns) * this.map.tilewidth,
          ~~(tId / tileset.columns) * this.map.tileheight,
          this.map.tilewidth,
          this.map.tileheight,
          (j % this.map.width) * this.map.tilewidth,
          ~~(j / this.map.width) * this.map.tileheight,
          this.map.tilewidth,
          this.map.tileheight,
        );
      }
    }
  }

  protected createCollisionEnity() {
    const collision = new Entity<undefined, undefined>(this.game, this, undefined);
    collision.name = 'collision';
    const layer = this.map.layers.find((l) => l.name === 'collision') as TyledObjectLayer;
    for (const obj of layer.objects) collision.hitboxes.push(this.mapObjectToPhysicsBody(obj));
    collision.hitboxes.push(new Line(new Vector2(), new Vector2(this.cam.max.x)));
    collision.hitboxes.push(new Line(new Vector2(), new Vector2(0, this.cam.max.y)));
    collision.hitboxes.push(new Line(new Vector2(this.cam.max.x), this.cam.max));
    collision.hitboxes.push(new Line(new Vector2(0, this.cam.max.y), this.cam.max));
    return collision;
  }

  protected mapObjectToPhysicsBody(obj: TyledObjectLayer['objects'][0]) {
    if (obj.ellipse)
      return new Circle(new Vector2(~~(obj.x + obj.width / 2), ~~(obj.y + obj.width / 2)), obj.width / 2);
    if (obj.polygon || obj.polyline)
      return new Poly(...(obj.polygon ?? obj.polyline)!.map((p) => new Vector2(obj.x + p.x, obj.y + p.y)));
    return new Rect(new Vector2(obj.x, obj.y), new Vector2(obj.x + obj.width, obj.y + obj.height));
  }

  protected createRoads() {
    const carsLayer = this.map.layers.find((x) => x.name === 'roads') as TyledObjectLayer;
    if (!carsLayer) return;
    this.roads = this.addTickable(
      new Roads(
        this.game,
        this,
        carsLayer.objects
          .filter((x) => !x.name.includes('_'))
          .map((path) => ({
            cars: [],
            name: path.name,
            path: (path.polygon ?? path.polyline)!.map((p) => new Vector2(path.x + p.x, path.y + p.y)),
            stopZones: new Set(),
          })),
        carsLayer.objects
          .filter((x) => x.name.includes('_stop'))
          .map((x) => {
            const [names, _, offset, time] = x.name.split('_');
            const e = new Entity(this.game, this, undefined);
            e.hitboxes.push(this.mapObjectToPhysicsBody(x));
            e.name = names;
            this.addEntity(e);
            return {
              hitbox: e,
              pathNames: names.split(','),
              status: 0,
              nextChangeTime: this.game.time + Number.parseInt(offset) * 1000,
              time: Number.parseInt(time) * 1000,
              trafficLights: carsLayer.objects
                .filter((x) => x.name === `${names}_trafficLight`)
                .map((t) => new Vector2(t.x, t.y)),
            };
          }),
      ),
    );
  }
}
