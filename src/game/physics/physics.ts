import Game from 'game/game'

import DynamicEntity from '../entities/dynamic-entity'
import Entity from '../entities/entity'
import { Tickable } from '../ticker'

import { PhysicsBody } from './body'
import Rect from './body/rect'
import Vector2 from './body/vector2'
import RTree from './rtree'

export default class Physics extends Tickable {
  private entities: Entity[] = []
  private staticRTree = new RTree()
  private rtree = new RTree()
  private rectBody = new WeakMap<Rect, PhysicsBody>()
  private bodyRect = new WeakMap<PhysicsBody, Rect>()
  private bodyEntity = new WeakMap<PhysicsBody, Entity>()
  private entityBodies = new WeakMap<Entity, PhysicsBody[]>()

  public constructor(
    game: Game,
    public size = new Vector2(),
    priority?: number,
  ) {
    super(game, priority)
  }

  public addEntity(entity: Entity) {
    this.entities.push(entity)
    this.updateEntity(entity)
    return entity
  }

  public removeEntity(entity: Entity) {
    const index = this.entities.indexOf(entity)
    if (index !== -1) {
      this.entities.splice(index, 1)
      const lastBodies = this.entityBodies.get(entity)
      if (lastBodies) {
        for (let index = 0; index < lastBodies.length; index++) {
          const body = lastBodies[index]!
          const rect = this.bodyRect.get(body)!
          this.rectBody.delete(rect)
          this.bodyRect.delete(body)
          this.bodyEntity.delete(body)
          if (entity instanceof DynamicEntity) this.rtree.remove(rect)
          else this.staticRTree.remove(rect)
        }
        this.entityBodies.delete(entity)
      }
    }
  }

  public updateEntity(entity: Entity) {
    const lastBodies = this.entityBodies.get(entity)
    if (lastBodies)
      for (let index = 0; index < lastBodies.length; index++) {
        const body = lastBodies[index]!
        const rect = this.bodyRect.get(body)!
        this.rectBody.delete(rect)
        this.bodyRect.delete(body)
        this.bodyEntity.delete(body)
        this.rtree.remove(rect)
      }
    const hitboxes = entity.getRelativeHitboxes()
    const rects: Rect[] = []
    for (let index = 0; index < hitboxes.length; index++) {
      const hitbox = hitboxes[index]!
      this.bodyEntity.set(hitbox, entity)
      const rect = hitbox.toRect()
      this.bodyRect.set(hitbox, rect)
      this.rectBody.set(rect, hitbox)
      if (entity instanceof DynamicEntity) this.rtree.push(rect)
      else this.staticRTree.push(rect)
      rects.push(rect)
    }
    this.entityBodies.set(entity, hitboxes)
    return { hitboxes, rects }
  }

  public tick(deltaTime: number) {
    const toUpdate = new Set<Entity>()
    for (let index = 0; index < this.entities.length; index++) {
      const entity = this.entities[index]
      if (!(entity instanceof DynamicEntity) || (entity.velocity.x === 0 && entity.velocity.y === 0)) continue
      entity.pos.x += entity.velocity.x * deltaTime
      entity.pos.y += entity.velocity.y * deltaTime
      const { hitboxes, rects } = this.updateEntity(entity)
      for (let index = 0; index < hitboxes.length; index++) {
        const hitbox = hitboxes[index]!
        const rect = rects[index]!
        const possibleCollissions: RTree[] = []
        this.rtree.search(rect, possibleCollissions)
        this.staticRTree.search(rect, possibleCollissions)
        for (let k = 0; k < possibleCollissions.length; k++) {
          const rtree = possibleCollissions[k]!
          const hitbox2 = this.rectBody.get(rtree.rect)
          if (!hitbox2) {
            console.error(`[PHYSICS ERROR] Entity ${entity.name} lost it's hitbox.`)
            continue
          }
          if (hitbox === hitbox2) continue
          const entity2 = this.bodyEntity.get(hitbox2)!
          if (entity === entity2) continue
          const separationVector = hitbox.collision(hitbox2)
          if (separationVector) {
            entity2.onCollide(entity, hitbox2, hitbox, separationVector)
            separationVector.multiply(-1)
            entity.onCollide(entity2, hitbox, hitbox2, separationVector)
            toUpdate.add(entity)
            if (entity2 instanceof DynamicEntity) toUpdate.add(entity2)
          }
        }
      }
    }
    for (const entity of toUpdate) this.updateEntity(entity)
  }
}
