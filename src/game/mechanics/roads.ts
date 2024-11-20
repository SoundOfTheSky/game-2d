import { random } from '@softsky/utils'

import Car from '../entities/car'
import Entity from '../entities/entity'
import Game from '../game'
import Map from '../maps/map'
import Vector2 from '../physics/body/vector2'
import { Tickable } from '../ticker'

const TRAFFIC_LIGHT_SPRITE_OFFSET = [
  new Vector2(256, 192),
  new Vector2(272, 192),
  new Vector2(288, 192),
  new Vector2(272, 192),
]
export default class Roads extends Tickable {
  declare public parent: Map
  public cityPropsImg

  public constructor(
    game: Game,
    public paths: {
      name: string
      path: Vector2[]
      cars: Car[]
      stopZones: Set<Entity>
      minSpawnTime?: number
      maxSpawnTime?: number
      nextSpawnTime?: number
    }[],
    public stops: {
      pathNames: string[]
      hitbox: Entity
      time: number
      nextChangeTime: number
      status: number
      trafficLights: Vector2[]
    }[] = [],
    priority?: number,
  ) {
    super(game, priority)
    this.cityPropsImg = this.game.resources['/game/tilesets/3_City_Props_16x16.png'] as HTMLImageElement
  }

  public tick(): void {
    for (let index = 0; index < this.paths.length; index++) {
      const path = this.paths[index]!
      const timeDelta = this.game.time - (path.nextSpawnTime ?? 0)
      if (timeDelta >= 0) {
        path.nextSpawnTime = this.game.time + random(path.minSpawnTime ?? 2000, path.maxSpawnTime ?? 12_000)
        const car = new Car(this.game, path.path)
        car.name = path.name
        car.stopZones = path.stopZones
        this.parent.addEntity(car)
        path.cars.push(car)
      }
      const lastPoint = path.path.at(-1)!
      for (let index = 0; index < path.cars.length; index++) {
        const car = path.cars[index]!
        if (lastPoint.distance(car.pos) <= 48) {
          this.parent.removeEntity(car)
          path.cars.splice(index--, 1)
        }
      }
    }
    for (let index = 0; index < this.stops.length; index++) {
      const stop = this.stops[index]!
      const timeDelta = this.game.time - stop.nextChangeTime
      if (timeDelta >= 0) {
        switch (stop.status) {
          case 0: { // Green->Yellow
            stop.nextChangeTime = this.game.time + 2000
            stop.status = 1
            for (let index2 = 0; index2 < this.paths.length; index2++) {
              const path = this.paths[index2]!
              if (stop.pathNames.includes(path.name)) path.stopZones.add(stop.hitbox)
            }
            break
          }
          case 1: { // Yellow->Red
            stop.nextChangeTime = this.game.time + stop.time
            stop.status = 2
            break
          }
          case 2: { // Red->Yellow
            stop.nextChangeTime = this.game.time + 2000
            stop.status = 3
            break
          }
          case 3: { // Yellow->Green
            stop.nextChangeTime = this.game.time + stop.time
            stop.status = 0
            for (let index2 = 0; index2 < this.paths.length; index2++) {
              const path = this.paths[index2]!
              if (stop.pathNames.includes(path.name)) path.stopZones.delete(stop.hitbox)
            }
            break
          }
        }
      }
      for (let index = 0; index < stop.trafficLights.length; index++) {
        const light = stop.trafficLights[index]!
        const offset = TRAFFIC_LIGHT_SPRITE_OFFSET[stop.status]!
        this.game.ctx.drawImage(
          this.cityPropsImg,
          offset.x,
          offset.y,
          16,
          32,
          light.x * this.parent.cam.scale - this.parent.cam.pos.x,
          light.y * this.parent.cam.scale - this.parent.cam.pos.y,
          16 * this.parent.cam.scale,
          32 * this.parent.cam.scale,
        )
      }
    }
  }
}
