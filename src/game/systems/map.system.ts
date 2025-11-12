import ECSEntity from '../../ecs/entity'
import { ECSSystem } from '../../ecs/system'
import { PhysicsBody } from '../../physics/body'
import Circle from '../../physics/body/circle'
import Line from '../../physics/body/line'
import Poly from '../../physics/body/poly'
import Rect from '../../physics/body/rect'
import Vector2 from '../../physics/body/vector2'
import { HitboxComponent } from '../components/hitbox.component'
import { RenderableComponent } from '../components/renderable.component'
import { TransformComponent } from '../components/transform.component'
import { initCanvas } from '../utils/canvas'
import DefaultWorld from '../worlds/default.world'

import { RenderSystem } from './render.system'

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
    polygon?: { x: number; y: number }[]
    polyline?: [{ x: number; y: number }, { x: number; y: number }]
  }[]
}

export default class MapSystem extends ECSSystem {
  declare public world: DefaultWorld
  public renderSystem
  protected _tiledDefinition!: TiledMap

  public get tiledDefinition(): TiledMap {
    return this._tiledDefinition
  }

  public set tiledDefinition(value: TiledMap) {
    // Destroy all map entities
    for (let index = 0; index < this.world.entities.length; index++) {
      const entity = this.world.entities[index]!
      if (entity.components.has(TransformComponent)) entity.destroy()
    }
    this._tiledDefinition = value
    this.createLayerEntities()
    this.createCollisionEntities()
  }

  public constructor(world: DefaultWorld) {
    super(world)
    this.renderSystem = this.world.systemMap.get(RenderSystem)!
  }

  public createLayerEntities() {
    const definition = this._tiledDefinition
    const width = definition.width * definition.tilewidth
    const height = definition.height * definition.tileheight
    this.renderSystem.border.b.x = width
    this.renderSystem.border.b.y = height
    for (let index = 0; index <= definition.layers.length; index++) {
      const layer = definition.layers[index]!
      if (layer.type !== 'tilelayer') break
      const entity = new ECSEntity(this.world)
      const canvas = document.createElement('canvas')
      new RenderableComponent(entity, {
        source: canvas,
        size: new Vector2(width, height),
        // Render first 3 layers on background, all next layer topmost
        priority: index < 3 ? height : 0,
      })
      new TransformComponent(entity)
      const { context } = initCanvas(canvas, width, height)
      for (let index = 0; index < layer.data.length; index++) {
        const id = layer.data[index]!
        if (id === 0) continue
        const tileset = definition.tilesets.findLast((t) => t.firstgid <= id)!
        const tId = id - tileset.firstgid
        context.drawImage(
          tileset.sourceFile,
          (tId % tileset.columns) * definition.tilewidth,
          ~~(tId / tileset.columns) * definition.tileheight,
          definition.tilewidth,
          definition.tileheight,
          (index % definition.width) * definition.tilewidth,
          ~~(index / definition.width) * definition.tileheight,
          definition.tilewidth,
          definition.tileheight,
        )
      }
    }
  }

  // protected createTriggerEntities() {
  //   const layer = this.tiledDefinition.layers.find(
  //     l => l.name === 'triggers',
  //   ) as TyledObjectLayer | undefined
  //   if (!layer) return
  //   for (let index = 0; index < layer.objects.length; index++) {
  //     const object = layer.objects[index]!
  //     const name = object.name.split('_')[0] as keyof typeof triggers
  //     if (name in triggers) {
  //       const entity = new triggers[name](this.game, object.name)
  //       entity.hitboxes.push(this.mapObjectToPhysicsBody(object))
  //       this.addEntity(entity)
  //     }
  //   }
  // }

  protected createCollisionEntities() {
    const layer = this.tiledDefinition.layers.find(
      (l) => l.name === 'collision',
    ) as TyledObjectLayer
    layer.objects.map((object) => this.createHitboxEntity(object))
    for (const body of this.renderSystem.border.toLines()) {
      const entity = new ECSEntity(this.world)
      new TransformComponent(entity)
      new HitboxComponent(entity, {
        body,
        types: new Set(['geometry']),
      })
    }
  }

  protected createHitboxEntity(
    object: TyledObjectLayer['objects'][0],
    entity = new ECSEntity(this.world),
  ) {
    new TransformComponent(entity, {
      position: new Vector2(object.x, object.y),
    })
    let body: PhysicsBody
    if (object.ellipse) body = new Circle(new Vector2(), object.width / 2)
    else if (object.polygon)
      body = new Poly(
        ...object.polygon.map(
          (p) => new Vector2(object.x + p.x, object.y + p.y),
        ),
      )
    else if (object.polyline)
      body = new Line(
        new Vector2(object.polyline[0].x, object.polyline[0].y),
        new Vector2(object.polyline[1].x, object.polyline[1].y),
      )
    else
      body = new Rect(new Vector2(), new Vector2(object.width, object.height))
    new HitboxComponent(entity, {
      body,
      types: new Set(['geometry']),
    })
    return entity
  }

  // protected createRoads() {
  //   const carsLayer = this.tiledDefinition.layers.find(x => x.name === 'roads') as
  //     | TyledObjectLayer
  //     | undefined
  //   if (!carsLayer) return
  //   this.addTickable(
  //     new Roads(
  //       this.game,
  //       carsLayer.objects
  //         .filter(x => !x.name.includes('_'))
  //         .map(path => ({
  //           cars: [],
  //           name: path.name,
  //           path: (path.polygon ?? path.polyline)!.map(
  //             p => new Vector2(path.x + p.x, path.y + p.y),
  //           ),
  //           stopZones: new Set(),
  //         })),
  //       carsLayer.objects
  //         .filter(x => x.name.includes('_stop'))
  //         .map((x) => {
  //           const [names, , offset, time] = x.name.split('_') as [
  //             string,
  //             string,
  //             string,
  //             string,
  //           ]
  //           const entity = new Entity(this.game, undefined)
  //           entity.hitboxes.push(this.mapObjectToPhysicsBody(x))
  //           entity.name = names
  //           this.addEntity(entity)
  //           return {
  //             hitbox: entity,
  //             pathNames: names.split(','),
  //             status: 0,
  //             nextChangeTime: this.game.time + Number.parseInt(offset) * 1000,
  //             time: Number.parseInt(time) * 1000,
  //             trafficLights: carsLayer.objects
  //               .filter(x => x.name === `${names}_trafficLight`)
  //               .map(t => new Vector2(t.x, t.y)),
  //           }
  //         }),
  //     ),
  //   )
  // }
}
