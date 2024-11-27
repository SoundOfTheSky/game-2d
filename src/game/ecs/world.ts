import { Constructor } from '@softsky/utils'

import ECSComponent from './component'
import ECSEntity from './entity'
import { ECSComponentFilter, ECSQuery } from './query'
import { ECSSystem } from './system'

export default class ECSWorld {
  public static lastId = 0

  public id = ++ECSComponent.lastId
  public entities: ECSEntity[] = []
  public systems: ECSSystem[] = []
  public queries: ECSQuery[] = []
  public onNextFrame: (() => unknown)[] = []
  public queueUpdates = new Map<ECSEntity, ECSComponentFilter[] | undefined>()
  public time = 0
  public deltaTime = 0
  public generatorSystem: Generator<unknown, unknown, unknown>[] = []
  public systemMap: Omit<Map<Constructor<ECSSystem>, ECSSystem>, 'get'> & {
    get<T extends ECSSystem>(key: Constructor<T>): T | undefined
  } = new Map()

  public update(time: number) {
    this.deltaTime = time - this.time
    this.time = time
    // Clear added and deleted properties of queries
    for (let index = 0; index < this.queries.length; index++) {
      const query = this.queries[index]!
      query.added.clear()
      query.deleted.clear()
    }

    // Process next tick subscriptions
    for (let index = 0; index < this.onNextFrame.length; index++)
      this.onNextFrame[index]!()
    this.onNextFrame.length = 0

    // Update queries with entities
    if (this.queueUpdates.size > 0) this.updateEntitiesInQueries()

    // System update
    for (let index = 0; index < this.systems.length; index++)
      this.systems[index]!.update()

    // Generator systems update
    for (let index = 0; index < this.generatorSystem.length; index++)
      if (this.generatorSystem[index]!.next().done)
        this.generatorSystem.splice(index--, 1)
  }

  private updateEntitiesInQueries() {
    for (const [entity, components] of this.queueUpdates) {
      for (let index = 0; index < this.queries.length; index++) {
        const query = this.queries[index]!
        if (components)
          for (let index = 0; index < components.length; index++) {
            if (query.subscriptions.has(components[index]!)) {
              const has = query.matches.has(entity)
              if (query.checkEntity(entity)) {
                if (!has) {
                  query.matches.add(entity)
                  query.added.add(entity)
                }
              }
              else if (has) {
                query.matches.delete(entity)
                query.deleted.add(entity)
              }
              break
            }
          }
        else {
          query.matches.delete(entity)
          query.deleted.add(entity)
        }
      }
    }
    this.queueUpdates.clear()
  }
}
