import { Base, Constructor } from '@softsky/utils'

import ECSEntity, { ECSEntityExport } from './entity'
import { ECSComponentFilter, ECSQuery } from './query'
import { ECSSystem } from './system'

/**
 * Base of ECS system. All your components, systems, queries and entities will be registered to it.
 * Worlds can't share state, but you can create sub world.
 *
 * I recommend using worlds for every set of systems that you have.
 * For example, you techincally can control time speed in a subworld.
 * This way you can create a UI world that has game world in it,
 * and if menu is open, you stop time in your game world, but still tick UI.
 *
 * Tick order:
 * 1. beforeNextQueueUpdate
 * 2. Queues are updated
 * 3. onNextTick
 * 4. systems tick
 * 5. generator systems tick
 */
export default class ECSWorld extends Base {
  public beforeNextQueueUpdate: (() => unknown)[] = []
  public onNextTick: (() => unknown)[] = []
  public entities: ECSEntity[] = []
  public systems: ECSSystem[] = []
  public queries: ECSQuery[] = []
  public queueUpdates = new Map<ECSEntity, ECSComponentFilter[] | undefined>()
  public time = 0
  public deltaTime = 0
  public generatorSystems: Generator<unknown, unknown, unknown>[] = []
  public systemMap: Omit<Map<Constructor<ECSSystem>, ECSSystem>, 'get'> & {
    get<T extends ECSSystem>(key: Constructor<T>): T | undefined
  } = new Map()

  public tick(time: number) {
    this.deltaTime = time - this.time
    this.time = time

    // Clear added and deleted properties of queries
    for (let index = 0; index < this.queries.length; index++) {
      const query = this.queries[index]!
      query.added.clear()
      query.deleted.clear()
    }

    // Process beforeNextQueueUpdate subscriptions
    for (let index = 0; index < this.beforeNextQueueUpdate.length; index++)
      this.beforeNextQueueUpdate[index]!()
    this.beforeNextQueueUpdate.length = 0

    // Update queries with entities
    if (this.queueUpdates.size !== 0) {
      for (const [entity, components] of this.queueUpdates)
        for (let index = 0; index < this.queries.length; index++)
          this.queries[index]!.updateEntity(entity, components)
      this.queueUpdates.clear()
    }

    // Process onNextTick subscriptions
    for (let index = 0; index < this.onNextTick.length; index++)
      this.onNextTick[index]!()
    this.onNextTick.length = 0

    // System update
    for (let index = 0; index < this.systems.length; index++)
      this.systems[index]!.tick()

    // Generator systems update
    for (let index = 0; index < this.generatorSystems.length; index++)
      if (this.generatorSystems[index]!.next().done)
        this.generatorSystems.splice(index--, 1)
  }

  public saveEntities(): ECSEntityExport[] {
    return this.entities.map((x) => x.toJSON())
  }

  public loadEntities(data: ECSEntityExport[]) {
    for (let index = 0; index < this.entities.length; index++) {
      const entity = this.entities[index]!
      this.queueUpdates.set(entity, undefined)
      ECSEntity.idMap.delete(entity.id)
    }
    this.entities.length = 0
    for (let index = 0; index < data.length; index++) {
      const entityData = data[index]!
      ;(Base.subclasses.get(entityData.className) as typeof ECSEntity).fromJSON(
        this,
        entityData,
      )
    }
  }

  /** Automatically called on changes to queue */
  public addQueueChange(entity: ECSEntity, changes?: ECSComponentFilter[]) {
    if (changes) {
      const update = this.queueUpdates.get(entity)
      if (update) update.push(...changes)
      else this.queueUpdates.set(entity, changes)
    } else this.queueUpdates.set(entity, undefined)
  }
}
