import { HitboxComponent } from '../../components/hitbox.component'
import { TransformComponent } from '../../components/transform.component'
import { VelocityComponent } from '../../components/velocity.component'
import ECSEntity from '../../ecs/entity'
import { ECSQuery } from '../../ecs/query'
import { ECSFixedUpdateSystem } from '../../ecs/system'
import DefaultWorld from '../../worlds/default.world'

import Rect from './body/rect'
import RTree from './rtree'

export default class PhysicsSystem extends ECSFixedUpdateSystem {
  declare public world: DefaultWorld
  public entities$

  protected lastEntities = new Set<ECSEntity>()
  protected staticRTree = new RTree()
  protected rtree = new RTree()
  protected rectHitbox = new WeakMap<Rect, HitboxComponent>()

  public constructor(world: DefaultWorld) {
    super(world)
    this.entities$ = new ECSQuery(world, [TransformComponent, HitboxComponent])
  }

  public fixedUpdate() {
    this.updateDeleted()
    for (const entity of this.entities$.matches) {
      const velocityComponent = entity.components.get(VelocityComponent)
      // Update entites with not zero velocity, that have tag to explicit update or simply new
      if (
        this.lastEntities.has(entity) &&
        !entity.tags.has('physicsUpdated') &&
        (!velocityComponent || velocityComponent.isZero())
      )
        continue
      const transformComponent = entity.components.get(TransformComponent)!
      const hitboxComponent = entity.components.get(HitboxComponent)!
      this.updateEntityComponents(
        transformComponent,
        hitboxComponent,
        velocityComponent,
      )
      const possibleCollissions: RTree[] = []
      this.rtree.search(hitboxComponent.data.rect!, possibleCollissions)
      this.staticRTree.search(hitboxComponent.data.rect!, possibleCollissions)
      for (let k = 0; k < possibleCollissions.length; k++) {
        const rtree = possibleCollissions[k]!
        const hitbox = this.rectHitbox.get(rtree.rect)!
        if (hitboxComponent === hitbox) continue
        const separationVector = hitboxComponent.data.worldBody!.collision(
          hitbox.data.worldBody!,
        )
        if (separationVector) {
          hitboxComponent.data.onCollide?.(
            hitboxComponent,
            hitbox,
            separationVector,
          )
          hitbox.data.onCollide?.(
            hitboxComponent,
            hitbox,
            separationVector.multiply(-1),
          )
        }
      }
    }
    this.lastEntities.clear()
    for (const entity of this.entities$.matches) this.lastEntities.add(entity)
  }

  protected updateEntityComponents(
    transformComponent: TransformComponent,
    hitboxComponent: HitboxComponent,
    velocityComponent?: VelocityComponent,
  ) {
    if (velocityComponent) {
      if (velocityComponent.data.acceleration) {
        velocityComponent.data.velocity.x +=
          velocityComponent.data.acceleration.x * this.timeBetweenUpdates
        velocityComponent.data.velocity.y +=
          velocityComponent.data.acceleration.y * this.timeBetweenUpdates
      }
      if (velocityComponent.data.terminalVelocity)
        velocityComponent.data.velocity.normalize(
          true,
          velocityComponent.data.terminalVelocity,
        )
      if (!velocityComponent.isZero()) {
        velocityComponent.data.lastDirection.x =
          velocityComponent.data.velocity.x
        velocityComponent.data.lastDirection.y =
          velocityComponent.data.velocity.y
        transformComponent.data.position.x +=
          velocityComponent.data.velocity.x * this.timeBetweenUpdates
        transformComponent.data.position.y +=
          velocityComponent.data.velocity.y * this.timeBetweenUpdates
      }
    }
    const worldBody = hitboxComponent.data.body
      .clone()
      .add(transformComponent.data.position)
    if (transformComponent.data.scale)
      worldBody.scale(transformComponent.data.scale)
    if (transformComponent.data.rotation)
      worldBody.rotate(transformComponent.data.rotation)
    if (hitboxComponent.data.rect) {
      if (velocityComponent) this.rtree.remove(hitboxComponent.data.rect)
      else this.staticRTree.remove(hitboxComponent.data.rect)
      this.rectHitbox.delete(hitboxComponent.data.rect)
    }
    const rect = worldBody.toRect()
    hitboxComponent.data.worldBody = worldBody
    hitboxComponent.data.rect = rect
    this.rectHitbox.set(rect, hitboxComponent)
    if (velocityComponent) this.rtree.push(rect)
    else this.staticRTree.push(rect)
  }

  protected updateDeleted() {
    for (const entity of this.lastEntities) {
      // Difference function is slower than just this check
      if (this.entities$.matches.has(entity)) continue
      const hitboxComponent = entity.components.get(HitboxComponent)
      if (hitboxComponent?.data.rect) {
        this.rectHitbox.delete(hitboxComponent.data.rect)
        if (entity.components.has(VelocityComponent))
          this.rtree.remove(hitboxComponent.data.rect)
        else this.staticRTree.remove(hitboxComponent.data.rect)
      }
    }
  }
}
