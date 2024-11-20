import ECSEntity from './entity'
import ECSWorld from './world'

/** Allows to pool entities.
 * Grabbing and reviving pooled entities is faster 1.5x-3x times.
 * The more complex an entity, the faster to revive it.
 *
 * Run before use preparePool to prepare some amount of entities to get speed benefits right away.
 */
export default class ECSEntityPool<T = any> {
  public pool: ECSEntity[] = []

  public constructor(
    public world: ECSWorld,
    private createEntity: (data: T, dontInitialize?: boolean) => ECSEntity,
    private setEntityData: (data: T, entity: ECSEntity) => ECSEntity,
  ) {}

  public get(data: T) {
    if (this.pool.length === 0) {
      const entity = this.createEntity(data)
      entity.pool = this
      return entity
    }
    const entity = this.setEntityData(data, this.pool.pop()!)
    entity.register()
    return entity
  }

  public clear(min: number) {
    this.pool.splice(min + 1, Infinity)
  }

  public preparePool(min: number, data: () => T) {
    for (let index = 0; index < min; index++) {
      const entity = this.createEntity(data(), true)
      entity.pool = this
      this.pool.push(entity)
    }
  }
}
