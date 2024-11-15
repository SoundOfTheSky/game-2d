import { random } from '@softsky/utils'

import Game from '../game'
import { PhysicsBody } from '../physics/body'
import Rect from '../physics/body/rect'
import Vector2 from '../physics/body/vector2'
import Img from '../renderable/img'
import { Ticker } from '../ticker'

import DynamicEntity, { Direction } from './dynamic-entity'
import Entity from './entity'
import Player from './player'

export default class Car extends DynamicEntity<Img, string> {
  public stopZones = new Set<Entity>()
  public skin = random(0, 5)
  public accelerationSpeed = 0.001
  public decelerationSpeed = 0.013
  protected skinOffset = [
    new Vector2(0, 0),
    new Vector2(192, 0),
    new Vector2(0, 64),
    new Vector2(192, 64),
    new Vector2(0, 128),
    new Vector2(192, 128),
  ]

  protected stopZone?: Entity
  protected pointI = 0
  protected directionSettings = {
    [Direction.RIGHT]: {
      hitboxes: [new Rect(new Vector2(0, 16), new Vector2(64, 32)), new Rect(new Vector2(-64, 16), new Vector2(0, 32))],
      offset: new Vector2(0, 16),
      size: new Vector2(64, 48),
    },
    [Direction.LEFT]: {
      hitboxes: [
        new Rect(new Vector2(0, 16), new Vector2(64, 32)),
        new Rect(new Vector2(64, 16), new Vector2(128, 32)),
      ],
      offset: new Vector2(96, 16),
      size: new Vector2(64, 48),
    },
    [Direction.UP]: {
      hitboxes: [new Rect(new Vector2(0, 0), new Vector2(32, 64)), new Rect(new Vector2(0, 64), new Vector2(32, 128))],
      offset: new Vector2(64, 0),
      size: new Vector2(32, 64),
    },
    [Direction.DOWN]: {
      hitboxes: [new Rect(new Vector2(0, 0), new Vector2(32, 64)), new Rect(new Vector2(0, -64), new Vector2(32, 0))],
      offset: new Vector2(160, 0),
      size: new Vector2(32, 64),
    },
  }

  public constructor(
    game: Game,
    parent: Ticker,
    public path: Vector2[],
    priority?: number,
  ) {
    const source = game.resources['/game/tilesets/10_Vehicles_16x16.png'] as HTMLImageElement
    super(game, parent, new Img(game, game, source), priority)
    this.name = 'car'
    this.pos.x = path[0]!.x
    this.pos.y = path[0]!.y
    this.updateModel()
  }

  public tick(deltaTime: number): void {
    const point = this.path[this.pointI]!
    if (this.pos.distance(point) < 16 && ++this.pointI === this.path.length) {
      this.pos.x = this.path[0]!.x
      this.pos.y = this.path[0]!.y
      this.pointI = 0
    }
    if (this.stopZone) {
      if (this.velocity.distance() <= this.decelerationSpeed) {
        this.velocity.x = 0
        this.velocity.y = 0
        this.acceleration.x = 0
        this.acceleration.y = 0
        if (this.stopZone instanceof Car ? !this.collideEntity(this.stopZone) : !this.stopZones.has(this.stopZone))
          delete this.stopZone
      }
      else {
        this.acceleration = this.velocity.clone().multiply(-1).normalize(false, this.decelerationSpeed)
        delete this.stopZone
      }
    }
    else this.acceleration = point.clone().subtract(this.pos).normalize(false, this.accelerationSpeed)
    super.tick(deltaTime)
    this.updateModel()
  }

  private updateModel() {
    const settings = this.directionSettings[this.direction]
    const skinOffset = this.skinOffset[this.skin]!
    this.img.offset.x = settings.offset.x + skinOffset.x
    this.img.offset.y = settings.offset.y + skinOffset.y
    this.img.size = settings.size
    this.hitboxes = settings.hitboxes
    this.hitboxMeta.set(this.hitboxes[0]!, 'hitbox')
    this.hitboxMeta.set(this.hitboxes[1]!, 'stopZone')
  }

  public onCollide(entity: Entity, hitbox: PhysicsBody, entityHitbox: PhysicsBody, separationVector: Vector2): void {
    const meta = this.hitboxMeta.get(hitbox)
    const entityMeta = entity.hitboxMeta.get(entityHitbox)
    if (meta !== 'hitbox') return
    if (entity instanceof Car && entityMeta === 'hitbox') this.pos.add(separationVector.multiply(0.5))
    else if (entity instanceof Player) {
      this.stopZone = entity
      entity.pos.add(separationVector.multiply(-1))
    }
    else if (this.stopZones.has(entity) || entityMeta === 'stopZone') this.stopZone = entity
  }
}
