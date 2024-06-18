import Entity from '../entities/entity';
import { Tickable, Ticker } from '../ticker';

import { PhysicsBody } from './body';
import Rect from './body/rect';
import Vector2 from './body/vector2';
import RTree from './rtree';

export default class Physics implements Tickable {
  private rtree = new RTree();
  private rectBody = new WeakMap<Rect, PhysicsBody>();
  private bodyRect = new WeakMap<PhysicsBody, Rect>();
  private bodyEntity = new WeakMap<PhysicsBody, Entity>();
  private entityBodies = new WeakMap<Entity, PhysicsBody[]>();

  public constructor(
    private entities: Entity[] = [],
    public parent: Ticker,
    public size = new Vector2(),
    public priority = 0,
  ) {
    for (let i = 0; i < this.entities.length; i++) this.updateEntity(this.entities[i]);
  }

  public addEntity(entity: Entity) {
    this.entities.push(entity);
    this.updateEntity(entity);
    return entity;
  }

  public removeEntity(entity: Entity) {
    const i = this.entities.indexOf(entity);
    if (i !== -1) {
      this.entities.splice(i, 1);
      const lastBodies = this.entityBodies.get(entity);
      if (lastBodies) {
        for (let i = 0; i < lastBodies.length; i++) {
          const body = lastBodies[i];
          const rect = this.bodyRect.get(body)!;
          this.rectBody.delete(rect);
          this.bodyRect.delete(body);
          this.bodyEntity.delete(body);
          this.rtree.remove(rect);
        }
        this.entityBodies.delete(entity);
      }
    }
  }

  public updateEntity(entity: Entity) {
    const lastBodies = this.entityBodies.get(entity);
    if (lastBodies)
      for (let i = 0; i < lastBodies.length; i++) {
        const body = lastBodies[i];
        const rect = this.bodyRect.get(body)!;
        this.rectBody.delete(rect);
        this.bodyRect.delete(body);
        this.bodyEntity.delete(body);
        this.rtree.remove(rect);
      }
    const hitboxes = entity.getRelativeHitboxes();
    const rects: Rect[] = [];
    for (let i = 0; i < hitboxes.length; i++) {
      const hitbox = hitboxes[i];
      this.bodyEntity.set(hitbox, entity);
      const rect = hitbox.toRect();
      this.bodyRect.set(hitbox, rect);
      this.rectBody.set(rect, hitbox);
      this.rtree.push(rect);
      rects.push(rect);
    }
    this.entityBodies.set(entity, hitboxes);
    return { hitboxes, rects };
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  public tick(deltaTime: number) {
    const toUpdate = new Set<Entity>();
    for (let i = 0; i < this.entities.length; i++) {
      const entity = this.entities[i];
      if (entity.velocity.x === 0 && entity.velocity.y === 0) continue;
      entity.pos.x += entity.velocity.x * deltaTime;
      entity.pos.y += entity.velocity.y * deltaTime;
      const { hitboxes, rects } = this.updateEntity(entity);
      for (let j = 0; j < hitboxes.length; j++) {
        const hitbox = hitboxes[j];
        const rect = rects[j];
        const possibleCollissions = this.rtree.search(rect);
        for (let k = 0; k < possibleCollissions.length; k++) {
          const rtree = possibleCollissions[k];
          const hitbox2 = this.rectBody.get(rtree.rect)!;
          if (hitbox === hitbox2) continue;
          const entity2 = this.bodyEntity.get(hitbox2)!;
          if (entity === entity2) continue;
          const separationVector = hitbox.collision(hitbox2);
          if (separationVector) {
            entity2.onCollide(entity, hitbox2, hitbox, separationVector);
            separationVector.scaleN(-1);
            entity.onCollide(entity2, hitbox, hitbox2, separationVector);
            toUpdate.add(entity);
            toUpdate.add(entity2);
          }
        }
      }
    }
    for (const entity of toUpdate) this.updateEntity(entity);
  }
}
