import { combinations } from '@softsky/utils'
// eslint-disable-next-line import-x/no-unresolved
import { describe, expect, it } from 'bun:test'

import ECSComponent from './component'
import ECSEntity from './entity'
import { ECSQuery } from './query'
import ECSWorld from './world'

describe('ecs', () => {
  class NumberComponent extends ECSComponent<number> {}
  class StringComponent extends ECSComponent<string> {}
  class A extends ECSComponent<number> {}
  class B extends ECSComponent<number> {}
  class C extends ECSComponent<number> {}
  class D extends ECSComponent<number> {}
  const COMBINATIONS = combinations([A, B, C, D])
  function testQuery(
    query: ECSQuery,
    entity: ECSEntity,
    constructors: (typeof ECSComponent<number>)[],
    shouldAdd = true,
  ) {
    expect(query.added.has(entity)).toBe(false)
    expect(query.entities.has(entity)).toBe(false)
    expect(query.deleted.has(entity)).toBe(false)
    const components = constructors.map((c) => new c(entity, 1))
    expect(query.added.has(entity)).toBe(false)
    expect(query.entities.has(entity)).toBe(false)
    expect(query.deleted.has(entity)).toBe(false)
    query.world.tick(16.6)
    expect(query.added.has(entity)).toBe(shouldAdd)
    expect(query.entities.has(entity)).toBe(shouldAdd)
    expect(query.deleted.has(entity)).toBe(false)
    query.world.tick(16.6)
    expect(query.added.has(entity)).toBe(false)
    expect(query.entities.has(entity)).toBe(shouldAdd)
    expect(query.deleted.has(entity)).toBe(false)
    for (const component of components) component.destroy()
    expect(query.added.has(entity)).toBe(false)
    expect(query.entities.has(entity)).toBe(shouldAdd)
    expect(query.deleted.has(entity)).toBe(false)
    query.world.tick(16.6)
    expect(query.added.has(entity)).toBe(false)
    expect(query.entities.has(entity)).toBe(false)
    expect(query.deleted.has(entity)).toBe(shouldAdd)
    query.world.tick(16.6)
    expect(query.added.has(entity)).toBe(false)
    expect(query.entities.has(entity)).toBe(false)
    expect(query.deleted.has(entity)).toBe(false)
  }

  it('Must register entities', () => {
    const world = new ECSWorld()
    const query = new ECSQuery(world, [NumberComponent])
    world.tick(17)
    expect(query.entities.size).toBe(0)
    const entity = new ECSEntity(world)
    world.tick(17 * 2)
    expect(query.entities.size).toBe(0)
    const sC = new StringComponent(entity, 'abc')
    world.tick(17 * 4)
    expect(query.entities.size).toBe(0)
    const nC = new NumberComponent(entity, 123)
    world.tick(17 * 5)
    expect(query.added.has(entity)).toBe(true)
    expect(query.entities.has(entity)).toBe(true)
    expect(query.deleted.has(entity)).toBe(false)
    sC.destroy()
    world.tick(17 * 6)
    expect(query.added.has(entity)).toBe(false)
    expect(query.entities.has(entity)).toBe(true)
    expect(query.deleted.has(entity)).toBe(false)
    nC.destroy()
    world.tick(17 * 6)
    expect(query.added.has(entity)).toBe(false)
    expect(query.entities.has(entity)).toBe(false)
    expect(query.deleted.has(entity)).toBe(true)
  })

  it('Query, all', () => {
    const world = new ECSWorld()
    const entity = new ECSEntity(world)
    const query = new ECSQuery(world, {
      all: [B, C],
    })
    for (const combination of COMBINATIONS)
      testQuery(
        query,
        entity,
        combination,
        combination.includes(B) && combination.includes(C),
      )
  })
  it('Query, any', () => {
    const world = new ECSWorld()
    const entity = new ECSEntity(world)
    const query = new ECSQuery(world, {
      any: [B, C],
    })
    for (const combination of COMBINATIONS)
      testQuery(
        query,
        entity,
        combination,
        combination.includes(B) || combination.includes(C),
      )
  })
  it('Query, not', () => {
    const world = new ECSWorld()
    const entity = new ECSEntity(world)
    const query = new ECSQuery(world, {
      not: [B, C],
      any: [A, B, C, D],
    })
    for (const combination of COMBINATIONS)
      testQuery(
        query,
        entity,
        combination,
        !combination.includes(B) &&
          !combination.includes(C) &&
          combination.length !== 0,
      )
  })
})
