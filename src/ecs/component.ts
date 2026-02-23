import { Constructor } from '@softsky/utils'

import ECSEntity from './entity'

export type ECSComponentExport<T = any> = {
  className: string
  id: number
  created: number
  data: T
}

/**
 * Components must only include state and no other logic.
 * This state must be parseable to JSON and from it,
 * otherwise override `toJSON()` and `static fromJSON()` methods.
 *
 * Upon creation ECSQueries are updated and the entity
 * you added this component to may now be queried by it.
 *
 * Don't forget to register to world when extending this class:
 * @example
 * static {
 *   world.registerComponentType(MyComponent)
 * }
 */
export default class ECSComponent<T = any> {
  public id: number
  /** Game time of creation. It's late by 1 tick */
  public created = 0
  /** Is component registered and can be queued */
  public registered = false

  protected readonly updatedSet

  public constructor(
    public entity: ECSEntity,
    public data: T,
    /** If set component won't register automatically */
    id?: number,
  ) {
    this.updatedSet = this.entity.world.updatedComponents.get(
      this.constructor as Constructor<ECSComponent>,
    )!
    this.id = id ?? ++entity.world.lastComponentId
    entity.world.componentIdMap.set(this.id, this)
    this.created = this.entity.world.time
    if (!id) this.register()
  }

  /**
   * Register component in entity, world & queries.
   * Called automatically, unless id specified
   *
   * Deferred if until next tick unless immediate specified.
   */
  public register(immediately?: boolean) {
    if (immediately) {
      const constructor = this.constructor as Constructor<ECSComponent>
      this.entity.components.set(constructor, this)
      if (this.entity.registered) this.entity.addQueueChange([constructor])
      this.registered = true
      this.markUpdated(true)
    } else
      this.entity.world.beforeNextQueueUpdate.push(
        this.register.bind(this, true),
      )
  }

  /**
   * Destroy component
   *
   * Deferred until next tick unless immediate specified
   */
  public destroy(immediately?: boolean): void {
    if (immediately) {
      const constructor = this.constructor as Constructor<ECSComponent>
      this.entity.components.delete(constructor)
      this.entity.addQueueChange([constructor])
      this.entity.world.componentIdMap.delete(this.id)
      this.registered = false
      this.markUpdated(true)
    } else
      this.entity.world.beforeNextQueueUpdate.push(
        this.destroy.bind(this, true),
      )
  }

  /**
   * Call this after data update.
   *
   * Deferred until next tick unless immediate specified.
   */
  public markUpdated(immediately?: boolean) {
    if (immediately) this.updatedSet.add(this)
    else
      this.entity.world.beforeNextQueueUpdate.push(
        this.destroy.bind(this, true),
      )
  }

  public toJSON(): ECSComponentExport {
    return {
      className: (this.constructor as Constructor<this>).name,
      id: this.id,
      data: this.data,
      created: this.created,
    }
  }

  public static fromJSON(entity: ECSEntity, data: ECSComponentExport) {
    const component = new this(entity, data.data, data.id)
    component.created = data.created
    return component
  }
}
