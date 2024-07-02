import { random } from '@/utils';

import Car from '../entities/car';
import Entity from '../entities/entity';
import Game from '../game';
import Map from '../maps/map';
import Vector2 from '../physics/body/vector2';
import { Tickable } from '../ticker';

const TRAFFIC_LIGHT_SPRITE_OFFSET = [
  new Vector2(256, 192),
  new Vector2(272, 192),
  new Vector2(288, 192),
  new Vector2(272, 192),
];
export default class Roads implements Tickable {
  public cityPropsImg;

  public constructor(
    public game: Game,
    public map: Map,
    public paths: {
      name: string;
      path: Vector2[];
      cars: Car[];
      stopZones: Set<Entity>;
      minSpawnTime?: number;
      maxSpawnTime?: number;
      nextSpawnTime?: number;
    }[],
    public stops: {
      pathNames: string[];
      hitbox: Entity;
      time: number;
      nextChangeTime: number;
      status: number;
      trafficLights: Vector2[];
    }[] = [],
    public priority = 0,
  ) {
    this.cityPropsImg = this.game.resources['/game/tilesets/3_City_Props_16x16.png'] as HTMLImageElement;
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  public tick(): void {
    for (let i = 0; i < this.paths.length; i++) {
      const path = this.paths[i];
      const timeDelta = this.game.time - (path.nextSpawnTime ?? 0);
      if (timeDelta >= 0) {
        path.nextSpawnTime = this.game.time + random(path.minSpawnTime ?? 2000, path.maxSpawnTime ?? 12000);
        const car = new Car(this.game, this.map, path.path, this.priority);
        car.name = path.name;
        car.stopZones = path.stopZones;
        this.map.addEntity(car);
        path.cars.push(car);
      }
      const lastPoint = path.path.at(-1)!;
      for (let i = 0; i < path.cars.length; i++) {
        const car = path.cars[i];
        if (lastPoint.distance(car.pos) <= 48) {
          this.map.removeEntity(car);
          path.cars.splice(i--, 1);
        }
      }
    }
    for (let i = 0; i < this.stops.length; i++) {
      const stop = this.stops[i];
      const timeDelta = this.game.time - (stop.nextChangeTime ?? 0);
      if (timeDelta >= 0) {
        switch (stop.status) {
          case 0: // Green->Yellow
            stop.nextChangeTime = this.game.time + 2000;
            stop.status = 1;
            for (let j = 0; j < this.paths.length; j++) {
              const path = this.paths[j];
              if (stop.pathNames.includes(path.name)) path.stopZones.add(stop.hitbox);
            }
            break;
          case 1: // Yellow->Red
            stop.nextChangeTime = this.game.time + stop.time;
            stop.status = 2;
            break;
          case 2: // Red->Yellow
            stop.nextChangeTime = this.game.time + 2000;
            stop.status = 3;
            break;
          case 3: // Yellow->Green
            stop.nextChangeTime = this.game.time + stop.time;
            stop.status = 0;
            for (let j = 0; j < this.paths.length; j++) {
              const path = this.paths[j];
              if (stop.pathNames.includes(path.name)) path.stopZones.delete(stop.hitbox);
            }
            break;
        }
      }
      for (let i = 0; i < stop.trafficLights.length; i++) {
        const light = stop.trafficLights[i];
        const offset = TRAFFIC_LIGHT_SPRITE_OFFSET[stop.status];
        this.game.ctx.drawImage(
          this.cityPropsImg,
          offset.x,
          offset.y,
          16,
          32,
          light.x * this.map.cam.scale - this.map.cam.pos.x,
          light.y * this.map.cam.scale - this.map.cam.pos.y,
          16 * this.map.cam.scale,
          32 * this.map.cam.scale,
        );
      }
    }
  }
}
