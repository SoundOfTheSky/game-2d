import { measurePerformance } from '@softsky/utils'

// console.log(measurePerformance(() => {
//   const n = random(10, 100)
//   const index = n / 16.6
//   const b = n % 16.6
// }))
// console.log(measurePerformance(() => {
//   const n = random(10, 100)
//   const index = n / 16.6
//   const b = n - index * 16.6
// }))

const n = new Set([1, 2, 3, 4, 5])
console.log(
  measurePerformance(() => {
    if (!n.has(3)) n.add(3)
  }),
  measurePerformance(() => {
    n.add(3)
  }),
)
