import { Base, Constructor } from '@softsky/utils'

import ECSComponent, { ECSComponentExport } from './component'
import ECSEntityPool from './entity-pool'
import { ECSComponentFilter } from './query'
import ECSWorld from './world'

export type ECSEntityExport = {
  className: string
  id: number
  version: number
  created: number
  tags: string[]
  components: ECSComponentExport[]
}

/**
 * ECSEntity is a main state holder for ECS system.
 * You can add any components to it, and based on those components
 * ECSSystems will queue for this entity and perform logic on it.
 *
 * For example add PosComponent and VelocityComponent and now PhysicsSystem
 * will start updating you ECSEntity.
 *
 * Also can include tags, which basically work as components without state.
 */
export default class ECSEntity extends Base {
  static {
    this.registerSubclass()
  }

  /** Is increased on deletion, so if reused, we can check it's not the same */
  public version = 1
  public created
  public registered = false
  /** Do not set or or remove tags directly unless sure */
  public tags = new Set<string>()
  /** Do not set or or remove components directly unless sure */
  public components: Omit<
    Map<Constructor<ECSComponent>, ECSComponent>,
    'get'
  > & {
    get<T, C extends ECSComponent<T>>(key: Constructor<C>): C | undefined
  } = new Map()
  public pool?: ECSEntityPool

  public constructor(
    public readonly world: ECSWorld,
    id?: number,
  ) {
    super(id)
    this.created = world.time
    if (!id) this.register()
  }

  /**
   * Register entity in world & queries.
   * Called automatically, unless id specified
   *
   * Deferred until next tick unless immediate specified
   */
  public register(immediately?: boolean) {
    if (immediately) {
      this.world.addQueueChange(this, this.getElements())
      this.world.entities.push(this)
      this.registered = true
    } else this.world.beforeNextQueueUpdate.push(this.register.bind(this, true))
  }

  /** Returns an array of tags and component constructors */
  public getElements() {
    return [...this.tags, ...this.components.keys()]
  }

  /** Check if has component OR filter */
  public has(component: ECSComponentFilter) {
    return typeof component === 'function'
      ? this.components.has(component)
      : this.tags.has(component)
  }

  /**
   * Add tag
   *
   * Deferred until next tick unless immediate specified
   */
  public addTag(tag: string, immediately?: boolean) {
    if (immediately) {
      this.tags.add(tag)
      this.addQueueChange([tag])
    } else
      this.world.beforeNextQueueUpdate.push(this.addTag.bind(this, tag, true))
  }

  /**
   * Delete tag
   *
   * Deferred until next tick unless immediate specified
   */
  public deleteTag(tag: string, immediately?: boolean) {
    if (immediately) {
      this.tags.delete(tag)
      this.addQueueChange([tag])
    } else
      this.world.beforeNextQueueUpdate.push(
        this.deleteTag.bind(this, tag, true),
      )
  }

  /**
   * Destroy entity
   *
   * Deferred until next tick unless immediate specified
   */
  public destroy(immediately?: boolean): void {
    if (immediately) {
      const index = this.world.entities.indexOf(this)
      if (index !== -1) this.world.entities.splice(index, 1)
      this.version++
      this.registered = false
      if (this.pool) this.pool.returnEntityToPoolAndUpdateQueries(this)
      else {
        this.world.queueUpdates.set(this, undefined)
        ECSEntity.idMap.delete(this.id)
      }
    } else this.world.beforeNextQueueUpdate.push(this.destroy.bind(this, true))
  }

  public toJSON(): ECSEntityExport {
    return {
      className: (this.constructor as Constructor<this>).name,
      id: this.id,
      created: this.created,
      tags: [...this.tags],
      version: this.version,
      components: [...this.components.values()].map((x) => x.toJSON()),
    }
  }

  public static fromJSON(world: ECSWorld, data: ECSEntityExport) {
    const entity = new this(world)
    entity.created = data.created
    entity.version = data.version
    entity.tags = new Set(...data.tags)
    for (let index = 0; index < data.components.length; index++) {
      const componentData = data.components[index]!
      ;(
        Base.subclasses.get(componentData.className) as typeof ECSComponent
      ).fromJSON(entity, componentData)
    }
    return entity
  }

  /** Automatically called on changes to queue. Don't call */
  public addQueueChange(changes?: ECSComponentFilter[]) {
    if (changes) {
      const update = this.world.queueUpdates.get(this)
      if (update) update.push(...changes)
      else this.world.queueUpdates.set(this, changes)
    } else this.world.queueUpdates.set(this, undefined)
  }
}
