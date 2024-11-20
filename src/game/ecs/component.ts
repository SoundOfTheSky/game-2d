import { Constructor } from '@softsky/utils'

import ECSEntity from './entity'

/**
 * ECSComponents can't exist ouside of ECSEntities.
 *
 * This components must only include state and no other logic.
 * This state must be parseable to JSON and from it.
 *
 * Upon creation ECSQueries are updated and the entity
 * you added this component to may now be queried by it.
*/
export default class ECSComponent<T = any> {
  public static lastId = 0
  public static idMap = new Map<number, ECSComponent>()

  public id = ++ECSComponent.lastId
  public registered = false

  protected _data!: T

  public get data(): T {
    return this._data
  }

  public set data(value: T) {
    this._data = value
  }

  public constructor(
    public entity: ECSEntity,
    data: T,
  ) {
    ECSComponent.idMap.set(this.id, this)
    this.data = data
    this.register()
  }

  public destroy(): void {
    this.entity.world.onNextFrame.push(this.destroyImmediately.bind(this))
  }

  public register(): void {
    this.entity.components.set(this.constructor as Constructor<this>, this)
    if (this.entity.registered) {
      const updates = this.entity.getQueueUpdates()
      updates.push(this.constructor as Constructor<this>)
    }
    this.registered = true
  }

  public destroyImmediately(): void {
    this.entity.components.delete(this.constructor as Constructor<this>)
    const updates = this.entity.getQueueUpdates()
    updates.push(this.constructor as Constructor<this>)
    this.registered = false
  }
}
