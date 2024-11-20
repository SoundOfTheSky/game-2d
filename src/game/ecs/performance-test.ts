import { random, randomFromArray } from '@softsky/utils'

import ECSComponent from './component'
import ECSEntity from './entity'
import { ECSQuery } from './query'
import ECSWorld from './world'

const Components = 100
const Systems = ~~(Components * 0.66)
const Queries = ~~(Components * 1.2)
const Entities = ~~(Components * 100)
const ChangeEntitiesPerTick = Components
const ComponentsPerEntity = ~~(Components * 0.1)

const world = new ECSWorld()

let t = performance.now()
const components: (typeof ECSComponent<number>)[] = []
for (let index = 0; index < Components; index++) {
  components.push(class extends ECSComponent<number> {})
}

const queries: ECSQuery[] = []
for (let index = 0; index < Queries; index++) {
  queries.push(new ECSQuery(world, [
    randomFromArray(components),
    randomFromArray(components),
    randomFromArray(components),
  ]))
}

for (let index = 0; index < Entities; index++) {
  const entity = new ECSEntity(world)
  for (let index = 0; index < ComponentsPerEntity; index++)
    new (randomFromArray(components))(entity, random(0, 10_000))
}

for (let index = 0; index < Systems; index++) {
  world.systems.push(() => {
    for (const entity of randomFromArray(queries).matches) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      entity
    }
  },
  )
}
console.log('Create all systems', ~~((performance.now() - t) * 100) / 100)
t = performance.now()
world.update(16.6)
console.log('Queries populate after creation', ~~((performance.now() - t) * 100) / 100)
t = performance.now()
world.update(16.6)
console.log('Only systems tick', ~~((performance.now() - t) * 100) / 100)
for (let index = 0; index < 6; index++) {
  t = performance.now()
  for (let index = 0; index < ChangeEntitiesPerTick / 2; index++) {
    randomFromArray(world.entities).destroy()
  }
  for (let index = 0; index < ChangeEntitiesPerTick / 2; index++) {
    const entity = new ECSEntity(world)
    for (let index = 0; index < ComponentsPerEntity; index++)
      new (randomFromArray(components))(entity, random(0, 10_000))
  }
  world.update(16.6)
  console.log('Regular tick', index, ~~((performance.now() - t) * 100) / 100)
}

// class NumberComponent extends ECSComponent<number> {}
// class StringComponent extends ECSComponent<string> {}

// const SomePool = new ECSEntityPool<{
//   n: number
//   s: string
// }>(
//   world,
//   (data, dontIntialize) => {
//     const entity = new ECSEntity(world, dontIntialize)
//     new NumberComponent(entity, data.n)
//     new StringComponent(entity, data.s)
//     return entity
//   },
//   (data, entity) => {
//     entity.components.get(NumberComponent)![0]!.data = data.n
//     return entity
//   })

// const query = new ECSQuery(world, [NumberComponent, StringComponent])
// let matches: ECSEntity[] = []
// for (let index = 0; index < 50; index++)
//   new ECSQuery(world, [NumberComponent, StringComponent])
// world.systems.push({
//   update() {
//     const t = performance.now()
//     for (let index = 0; index < matches.length; index++) {
//       // eslint-disable-next-line @typescript-eslint/no-unused-expressions
//       matches[index]
//     }
//     // for (const entity of query.matches) {
//     //   // eslint-disable-next-line @typescript-eslint/no-unused-expressions
//     //   entity
//     // }
//     console.log('system', performance.now() - t)
//   },
// })

// const t1 = performance.now()
// for (let index = 0; index < 50_000; index++)
//   SomePool.get({
//     n: 1,
//     s: 'a',
//   })
// matches = [...query.matches]
// world.tick(16.6)
// const t2 = performance.now()
// console.log('create 50000', t2 - t1)
// for (let index = 0; index < world.entities.length; index++)
//   world.entities[index]!.destroy()
// matches = [...query.matches]
// world.tick(16.6)
// const t3 = performance.now()
// console.log('destroy 50000', t3 - t2)

// // setInterval(() => {
// //   world.tick(16.6)
// // }, 1000)
