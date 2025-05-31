import { describe, expect, it } from '@jest/globals'
import { combinations } from '@softsky/utils'

import ECSComponent from './component'
import ECSEntity from './entity'
import { ECSQuery } from './query'
import ECSWorld from './world'

class NumberComponent extends ECSComponent<number> {}
class StringComponent extends ECSComponent<string> {}
class A extends ECSComponent<number> {}
class B extends ECSComponent<number> {}
class C extends ECSComponent<number> {}
class D extends ECSComponent<number> {}
const COMBINATIONS = combinations([A, B, C, D])

describe('ecs', () => {
  function testQuery(
    query: ECSQuery,
    entity: ECSEntity,
    constructors: (typeof ECSComponent<number>)[],
    shouldAdd = true,
  ) {
    expect(query.added.has(entity)).toBe(false)
    expect(query.matches.has(entity)).toBe(false)
    expect(query.deleted.has(entity)).toBe(false)
    const components = constructors.map((c) => new c(entity, 1))
    expect(query.added.has(entity)).toBe(false)
    expect(query.matches.has(entity)).toBe(false)
    expect(query.deleted.has(entity)).toBe(false)
    query.world.tick(16.6)
    expect(query.added.has(entity)).toBe(shouldAdd)
    expect(query.matches.has(entity)).toBe(shouldAdd)
    expect(query.deleted.has(entity)).toBe(false)
    query.world.tick(16.6)
    expect(query.added.has(entity)).toBe(false)
    expect(query.matches.has(entity)).toBe(shouldAdd)
    expect(query.deleted.has(entity)).toBe(false)
    for (const component of components) component.destroy()
    expect(query.added.has(entity)).toBe(false)
    expect(query.matches.has(entity)).toBe(shouldAdd)
    expect(query.deleted.has(entity)).toBe(false)
    query.world.tick(16.6)
    expect(query.added.has(entity)).toBe(false)
    expect(query.matches.has(entity)).toBe(false)
    expect(query.deleted.has(entity)).toBe(shouldAdd)
    query.world.tick(16.6)
    expect(query.added.has(entity)).toBe(false)
    expect(query.matches.has(entity)).toBe(false)
    expect(query.deleted.has(entity)).toBe(false)
  }

  it('Must register entities', () => {
    const world = new ECSWorld()
    const query = new ECSQuery(world, [NumberComponent])
    world.tick(17)
    expect(query.matches.size).toBe(0)
    const entity = new ECSEntity(world)
    world.tick(17 * 2)
    expect(query.matches.size).toBe(0)
    const sC = new StringComponent(entity, 'abc')
    world.tick(17 * 4)
    expect(query.matches.size).toBe(0)
    const nC = new NumberComponent(entity, 123)
    world.tick(17 * 5)
    expect(query.added.has(entity)).toBe(true)
    expect(query.matches.has(entity)).toBe(true)
    expect(query.deleted.has(entity)).toBe(false)
    sC.destroy()
    world.tick(17 * 6)
    expect(query.added.has(entity)).toBe(false)
    expect(query.matches.has(entity)).toBe(true)
    expect(query.deleted.has(entity)).toBe(false)
    nC.destroy()
    world.tick(17 * 6)
    expect(query.added.has(entity)).toBe(false)
    expect(query.matches.has(entity)).toBe(false)
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
  it('Query, one', () => {
    const world = new ECSWorld()
    const entity = new ECSEntity(world)
    const query = new ECSQuery(world, {
      one: [B, C],
    })
    for (const combination of COMBINATIONS)
      testQuery(
        query,
        entity,
        combination,
        (combination.includes(B) ? 1 : 0) +
          (combination.includes(C) ? 1 : 0) ===
          1,
      )
  })
})
