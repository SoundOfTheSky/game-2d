import { Base } from '@softsky/utils'

import ECSComponent from './component'
import ECSEntity from './entity'
import { ECSQuery } from './query'
import ECSWorld from './world'

/**
 * Allows to pool entities.
 * Getting pooled entities is faster 1.5x-3x times.
 *
 * __DO NOT__ add or delete entity's tags or components.
 * Otherwise, before destoying them either:
 * 1. Delete from pool: `delete entity.pool`
 * 2. Restore to initial tags and components
 */
export default class ECSEntityPool {
  public entities: ECSEntity[] = []
  protected tags
  protected components
  protected entityConstructor
  protected queries: ECSQuery[] = []

  public constructor(
    public world: ECSWorld,
    options: {
      entityConstructor?: typeof ECSEntity
      tags?: string[]
      components?: Map<typeof ECSComponent, any>
    } = {},
  ) {
    this.tags = options.tags ?? new Set<string>()
    this.components = options.components ?? []
    this.entityConstructor = options.entityConstructor ?? ECSEntity
    const entity = this.createEntity()
    this.queries = this.world.queries.filter((q) => q.checkEntity(entity))
  }

  public get(components?: Map<typeof ECSComponent, any>) {
    const entity =
      this.entities.length === 0
        ? this.createEntity(components)
        : this.restoreEntity(this.entities.pop()!, components)
    this.world.beforeNextQueueUpdate.push(() => {
      this.world.entities.push(entity)
      entity.registered = true
      for (let index = 0; index < this.queries.length; index++) {
        const query = this.queries[index]!
        query.added.add(entity)
        query.matches.add(entity)
      }
    })

    return entity
  }

  public clear(min: number) {
    const entities = this.entities.splice(min + 1, Infinity)
    for (let index = 0; index < entities.length; index++)
      ECSEntity.idMap.delete(entities[index]!.id)
  }

  public preparePool(min: number, components?: Map<typeof ECSComponent, any>) {
    for (let index = 0; index < min; index++)
      this.entities.push(this.createEntity(components))
  }

  /** Use `entity.destroy()` instead */
  public returnEntityToPoolAndUpdateQueries(entity: ECSEntity) {
    this.entities.push(entity)
    for (let index = 0; index < this.queries.length; index++) {
      const query = this.queries[index]!
      query.deleted.add(entity)
      query.matches.delete(entity)
    }
  }

  protected createEntity(components?: Map<typeof ECSComponent, any>) {
    const entity = new this.entityConstructor(this.world, ++Base.lastId)
    entity.tags = new Set(...this.tags)
    for (const [component, data] of this.components)
      new component(entity, components?.get(component) ?? data, ++Base.lastId)
    return entity
  }

  protected restoreEntity(
    entity: ECSEntity,
    components?: Map<typeof ECSComponent, any>,
  ) {
    entity.tags = new Set(...this.tags)
    for (const [component, data] of this.components)
      entity.components.get(component)!.data =
        components?.get(component) ?? data
    return entity
  }
}
