import Collision from '../entities/collision'
import Entity from '../entities/entity'
import Game from '../game'
import Roads from '../mechanics/roads'
import Circle from '../physics/body/circle'
import Line from '../physics/body/line'
import Poly from '../physics/body/poly'
import Rect from '../physics/body/rect'
import Vector2 from '../physics/body/vector2'
import Physics from '../physics/physics'
import { Ticker } from '../ticker'
import triggers from '../triggers'

import Cam from './cam'

export type TiledMap = {
  width: number // tiles
  height: number
  tilewidth: number
  tileheight: number
  tilesets: {
    firstgid: number
    source: string
    sourceFile: HTMLImageElement
    columns: number
  }[]
  layers: (TyledTyleLayer | TyledObjectLayer)[]
}

export type TyledTyleLayer = {
  name: string
  type: 'tilelayer'
  data: number[]
}

export type TyledObjectLayer = {
  name: string
  type: 'objectgroup'
  objects: {
    name: string
    x: number
    y: number
    height: number
    width: number
    ellipse?: boolean
    polygon?: { x: number, y: number }[]
    polyline?: [{ x: number, y: number }, { x: number, y: number }]
  }[]
}

export default class Map extends Ticker {
  public name = 'default'
  public prerenderedLayers: HTMLCanvasElement[] = []
  public cam
  public physics

  public constructor(
    game: Game,
    public map: TiledMap,
    priority = 100,
  ) {
    super(game, priority)
    this.cam = new Cam(game)
    this.cam.max.x = this.map.width * this.map.tilewidth
    this.cam.max.y = this.map.height * this.map.tileheight
    this.physics = new Physics(this.game, this.cam.max, 1)
    this.createCollisionEntity()
    this.createRoads()
    this.createTriggerEntities()
    this.updateMap()
  }

  /** Don't calls super */
  public tick(deltaTime: number): void {
    this.cam.tick(deltaTime)
    this.physics.tick(deltaTime)
    this.tickables.sort(
      (a, b) =>
        (a instanceof Entity ? a.pos.y : 0)
        - (b instanceof Entity ? b.pos.y : 0),
    )
    const x = this.cam.pos.x / this.cam.scale
    const y = this.cam.pos.y / this.cam.scale
    const dx = this.game.canvas.width / this.cam.scale
    const dy = this.game.canvas.height / this.cam.scale
    for (let index = 0; index < this.prerenderedLayers.length; index++) {
      const layer = this.prerenderedLayers[index]!
      this.game.ctx.drawImage(
        layer,
        x,
        y,
        dx,
        dy,
        0,
        0,
        this.game.canvas.width,
        this.game.canvas.height,
      )
      if (index === 2)
        // 3 layers draw behind
        for (let index = 0; index < this.tickables.length; index++) {
          const item = this.tickables[index]
          if (item instanceof Entity) item.tick(deltaTime)
        }
    }
    for (let index = 0; index < this.tickables.length; index++) {
      const item = this.tickables[index]!
      if (!(item instanceof Entity)) item.tick(deltaTime)
    }
  }

  public addEntity(entity: Entity) {
    this.addTickable(entity)
    this.cam.entities.push(entity)
    this.physics.addEntity(entity)
    return entity
  }

  public removeEntity(entity: Entity) {
    this.removeTickable(entity)
    this.cam.entities.splice(this.cam.entities.indexOf(entity), 1)
    this.physics.removeEntity(entity)
  }

  public updateMap() {
    this.prerenderedLayers = []
    for (let index = 0; index <= this.map.layers.length; index++) {
      const layer = this.map.layers[index]!
      if (layer.type !== 'tilelayer') break
      const canvas = document.createElement('canvas')
      this.prerenderedLayers.push(canvas)
      const { ctx } = Game.initCanvas(
        canvas,
        this.map.width * this.map.tilewidth,
        this.map.height * this.map.tileheight,
      )
      for (let index = 0; index < layer.data.length; index++) {
        const id = layer.data[index]!
        if (id === 0) continue
        const tileset = this.map.tilesets.findLast(t => t.firstgid <= id)!
        const tId = id - tileset.firstgid
        ctx.drawImage(
          tileset.sourceFile,
          (tId % tileset.columns) * this.map.tilewidth,
          ~~(tId / tileset.columns) * this.map.tileheight,
          this.map.tilewidth,
          this.map.tileheight,
          (index % this.map.width) * this.map.tilewidth,
          ~~(index / this.map.width) * this.map.tileheight,
          this.map.tilewidth,
          this.map.tileheight,
        )
      }
    }
  }

  protected createTriggerEntities() {
    const layer = this.map.layers.find(
      l => l.name === 'triggers',
    ) as TyledObjectLayer | undefined
    if (!layer) return
    for (let index = 0; index < layer.objects.length; index++) {
      const object = layer.objects[index]!
      const name = object.name.split('_')[0] as keyof typeof triggers
      if (name in triggers) {
        const entity = new triggers[name](this.game, object.name)
        entity.hitboxes.push(this.mapObjectToPhysicsBody(object))
        this.addEntity(entity)
      }
    }
  }

  protected createCollisionEntity() {
    const entity = new Collision(this.game, undefined)
    const layer = this.map.layers.find(
      l => l.name === 'collision',
    ) as TyledObjectLayer
    entity.hitboxes = layer.objects.map(object =>
      this.mapObjectToPhysicsBody(object),
    )
    entity.hitboxes.push(
      new Line(new Vector2(), new Vector2(this.cam.max.x)),
      new Line(new Vector2(), new Vector2(0, this.cam.max.y)),
      new Line(new Vector2(this.cam.max.x), this.cam.max),
      new Line(new Vector2(0, this.cam.max.y), this.cam.max),
    )
    this.physics.addEntity(entity)
  }

  protected mapObjectToPhysicsBody(object: TyledObjectLayer['objects'][0]) {
    if (object.ellipse)
      return new Circle(
        new Vector2(
          ~~(object.x + object.width / 2),
          ~~(object.y + object.width / 2),
        ),
        object.width / 2,
      )
    if (object.polygon || object.polyline)
      return new Poly(
        ...(object.polygon ?? object.polyline)!.map(
          p => new Vector2(object.x + p.x, object.y + p.y),
        ),
      )
    return new Rect(
      new Vector2(object.x, object.y),
      new Vector2(object.x + object.width, object.y + object.height),
    )
  }

  protected createRoads() {
    const carsLayer = this.map.layers.find(x => x.name === 'roads') as
      | TyledObjectLayer
      | undefined
    if (!carsLayer) return
    this.addTickable(
      new Roads(
        this.game,
        carsLayer.objects
          .filter(x => !x.name.includes('_'))
          .map(path => ({
            cars: [],
            name: path.name,
            path: (path.polygon ?? path.polyline)!.map(
              p => new Vector2(path.x + p.x, path.y + p.y),
            ),
            stopZones: new Set(),
          })),
        carsLayer.objects
          .filter(x => x.name.includes('_stop'))
          .map((x) => {
            const [names, , offset, time] = x.name.split('_') as [
              string,
              string,
              string,
              string,
            ]
            const entity = new Entity(this.game, undefined)
            entity.hitboxes.push(this.mapObjectToPhysicsBody(x))
            entity.name = names
            this.addEntity(entity)
            return {
              hitbox: entity,
              pathNames: names.split(','),
              status: 0,
              nextChangeTime: this.game.time + Number.parseInt(offset) * 1000,
              time: Number.parseInt(time) * 1000,
              trafficLights: carsLayer.objects
                .filter(x => x.name === `${names}_trafficLight`)
                .map(t => new Vector2(t.x, t.y)),
            }
          }),
      ),
    )
  }
}
