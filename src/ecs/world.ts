import { Constructor } from '@softsky/utils'

import ECSComponent from './component'
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
export default class ECSWorld {
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
  public updatedComponents: Omit<
    Map<Constructor<ECSComponent>, Set<ECSComponent>>,
    'get'
  > & {
    get<T, C extends ECSComponent<T>>(key: Constructor<C>): Set<C> | undefined
  } = new Map()
  public updatedEntities: Omit<
    Map<Constructor<ECSEntity>, Set<ECSEntity>>,
    'get'
  > & {
    get<C extends ECSEntity>(key: Constructor<C>): Set<C> | undefined
  } = new Map()
  public componentConstructorMap = new Map<string, Constructor<ECSComponent>>()
  public entityConstructorMap = new Map<string, Constructor<ECSEntity>>()
  public componentIdMap = new Map<number, ECSComponent>()
  public entityIdMap = new Map<number, ECSEntity>()
  public lastComponentId = 0
  public lastEntityId = 0

  public tick(time: number) {
    this.deltaTime = time - this.time
    this.time = time

    // Clear added and deleted properties of queries
    for (let index = 0; index < this.queries.length; index++) {
      const query = this.queries[index]!
      query.added.clear()
      query.deleted.clear()
    }

    // Clear updated components
    for (const updatedComponentSet of this.updatedComponents.values())
      updatedComponentSet.clear()

    // Process beforeNextQueueUpdate subscriptions
    // All updates to quries happen here
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
    for (let index = 0; index < this.entities.length; index++)
      this.queueUpdates.set(this.entities[index]!, undefined)
    this.entityIdMap.clear()
    this.entities.length = 0
    for (let index = 0; index < data.length; index++) {
      const entityData = data[index]!
      ;(
        this.entityConstructorMap.get(entityData.className) as typeof ECSEntity
      ).fromJSON(this, entityData)
    }
  }

  public registerComponentType(
    componentConstructor: Constructor<ECSComponent>,
  ) {
    this.componentConstructorMap.set(
      componentConstructor.name,
      componentConstructor,
    )
    this.updatedComponents.set(componentConstructor, new Set())
  }

  public registerEntityType(entityConstructor: Constructor<ECSEntity>) {
    this.entityConstructorMap.set(entityConstructor.name, entityConstructor)
    this.updatedEntities.set(entityConstructor, new Set())
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
