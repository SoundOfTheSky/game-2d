import { Constructor } from '@softsky/utils'

import ECSComponent from './component'
import ECSEntity from './entity'
import ECSWorld from './world'

export type ECSKey = string | number | symbol
export type ECSComponentFilter = Constructor<ECSComponent> | ECSKey

const types = ['all', 'any', 'not', 'one', 'customSubscription'] as const

/**
 * ECSQueries will help you find ECSEntities in a world based on filters.
 * ECSQueries are very optimized and automatically updated once created.
 *
 * If you want entities that include PosComponent and VelocityComponent
 * you simple create query with array `[PosComponent, VelocityComponent]`.
 *
 * Found entities are stored in `mathes` array.
 * This array is never redefined, so fill free to pass it as a reference. It will always be updated.
 *
 * Also queries can be more complex. Try passing an object and read fields' descriptions.
 *
 * Be mindfull, that if you change Query after creation you must call `.fullUpdate()`.
 * Creating or updating queries in an already running world with lots of entities
 * might cause a lag spike.
 */
export class ECSQuery {
  public static lastId = 0
  public static idMap = new Map<number, ECSQuery>()

  public id = ++ECSQuery.lastId
  /** Subscribe to changes to revaluate. Do not modify! */
  public subscriptions = new Set<ECSComponentFilter>()
  /** Entities that pass all checks */
  public matches = new Set<ECSEntity>()
  /** Entities thate were just added */
  public added = new Set<ECSEntity>()
  /** Entities thate were just deleted */
  public deleted = new Set<ECSEntity>()
  /** Find entities with all of these. Same as creating with array. */
  public all?: ECSComponentFilter[]
  /** Find entities with at least on of those */
  public any?: ECSComponentFilter[]
  /** Find entities with ONLY ONE of those. */
  public one?: ECSComponentFilter[]
  /** Find entities WITHOUT these */
  public not?: ECSComponentFilter[]
  /** Custom search function. Please use with field `customSubscription` */
  public custom?: (entity: ECSEntity) => boolean
  /**
   * Check entities on change of those.
   * Only useful if using with `custom()` cause other filters are subscribed automatically.
   */
  public customSubscription?: ECSComponentFilter[]

  public constructor(
    public world: ECSWorld,
    options: {
      /** Find entities with all of these. Same as creating with array. */
      all?: ECSComponentFilter[]
      /** Find entities with at least on of those */
      any?: ECSComponentFilter[]
      /** Find entities with ONLY ONE of those. */
      one?: ECSComponentFilter[]
      /** Find entities WITHOUT these */
      not?: ECSComponentFilter[]
      /** Custom search function. Please use with field `customSubscription` */
      custom?: (entity: ECSEntity) => boolean
      /**
       * Check entities on change of those.
       * Only useful if using with `custom()` cause other filters are subscribed automatically.
       */
      customSubscription?: ECSComponentFilter[]
    } | ECSComponentFilter[]) {
    ECSQuery.idMap.set(this.id, this)
    world.queries.push(this)
    if (Array.isArray(options)) this.all = options
    else Object.assign(this, options)
    this.fullUpdate()
  }

  public fullUpdate() {
    this.subscriptions.clear()
    this.matches.clear()
    for (let index = 0; index < types.length; index++) {
      const type = this[types[index]!]
      if (type)
        for (let index = 0; index < type.length; index++)
          this.subscriptions.add(type[index]!)
    }
    for (let index = 0; index < this.world.entities.length; index++) {
      const entity = this.world.entities[index]!
      if (this.checkEntity(entity)) {
        this.matches.add(entity)
        this.added.add(entity)
      }
    }
  }

  public checkEntity(entity: ECSEntity) {
    if (this.all)
      for (let index = 0; index < this.all.length; index++)
        if (!entity.has(this.all[index]!)) return false
    if (this.any)
      for (let index = 0; index < this.any.length; index++) {
        if (entity.has(this.any[index]!)) break
        if (index + 1 === this.any.length) return false
      }
    if (this.one) {
      let found = false
      for (let index = 0; index < this.one.length; index++) {
        if (entity.has(this.one[index]!)) {
          if (found) return false
          found = true
        }
      }
      if (!found) return false
    }
    if (this.not)
      for (let index = 0; index < this.not.length; index++)
        if (entity.has(this.not[index]!)) return false
    if (this.custom && !this.custom(entity)) return false
    return true
  }

  public destroy() {
    const index = this.world.queries.indexOf(this)
    if (index !== -1)
      this.world.queries.splice(index, 1)
  }
}
