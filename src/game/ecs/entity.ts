import { Constructor } from '@softsky/utils'

import ECSComponent from './component'
import ECSEntityPool from './entity-pool'
import { ECSComponentFilter, ECSKey } from './query'
import ECSWorld from './world'

/**
 * ECSEntity is a main state holder for ECS system.
 * You can add any components to it, and based on those components
 * ECSSystems will queue for this entity and perform logic on it.
 *
 * For example add PosComponent and VelocityComponent and now PhysicsSystem
 * will start updating you ECSEntity.
 *
 * Also can include tags, which basically work as components without state
 */
export default class ECSEntity {
  public static lastId = 0
  public static idMap = new Map<number, ECSEntity>()

  public id = ++ECSEntity.lastId
  public registered = false
  public version = 1

  public pool?: ECSEntityPool
  public components: Omit<Map<Constructor<ECSComponent>, ECSComponent>, 'get'> & {
    get<T, C extends ECSComponent<T>>(key: Constructor<C>): C | undefined
  } = new Map()

  private tags = new Set<string | number | symbol>()

  public constructor(public world: ECSWorld, dontRegister?: boolean) {
    ECSEntity.idMap.set(this.id, this)
    if (!dontRegister) this.register()
  }

  public register(): void {
    this.world.entities.push(this)
    this.getQueueUpdates().push(...this.tags, ...this.components.keys())
    this.registered = true
  }

  public has(component: ECSComponentFilter) {
    return typeof component === 'function'
      ? this.components.has(component)
      : this.tags.has(component)
  }

  public addTag(tag: ECSKey) {
    this.world.onNextFrame.push(this.addTagImmediately.bind(this, tag))
  }

  public deleteTag(tag: ECSKey) {
    this.world.onNextFrame.push(this.deleteTagImmediately.bind(this, tag))
  }

  public hasTag(tag: ECSKey) {
    return this.tags.has(tag)
  }

  public destroy(): void {
    this.world.onNextFrame.push(this.destroyImmediately.bind(this))
  }

  public getQueueUpdates() {
    let update = this.world.queueUpdates.get(this)
    if (!update) {
      update = []
      this.world.queueUpdates.set(this, update)
    }
    return update
  }

  public addTagImmediately(tag: ECSKey) {
    this.tags.add(tag)
    this.getQueueUpdates().push(tag)
  }

  public deleteTagImmediately(tag: ECSKey) {
    this.tags.delete(tag)
    this.getQueueUpdates().push(tag)
  }

  public destroyImmediately(): void {
    const index = this.world.entities.indexOf(this)
    if (index !== -1) this.world.entities.splice(index, 1)
    this.world.queueUpdates.set(this, undefined)
    this.version++
    this.pool?.pool.push(this)
    this.registered = false
  }
}
