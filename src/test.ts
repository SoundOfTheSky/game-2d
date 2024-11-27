// console.log(measurePerformance(() => {
//   const n = random(10, 100)
//   const index = n / 16.6
//   const b = n % 16.6
// }))
// console.log(measurePerformance(() => { // Win
//   const n = random(10, 100)
//   const index = n / 16.6
//   const b = n - index * 16.6
// }))

// const n = new Set([1, 2, 3, 4, 5])
// console.log(
//   measurePerformance(() => {
//     if (!n.has(3)) n.add(3)
//   }),
//   measurePerformance(() => {
//     n.add(3) // Win
//   }),
// )

// const n = new Set([1, 2, 3, 4, 5])
// console.log(
//   measurePerformance(() => {
//     if (!n.has(3)) n.add(3)
//   }),
//   measurePerformance(() => {
//     n.add(3)
//   }),
// )

// const n = new Set([1, 2, 3, 4, 5])
// console.log(
//   measurePerformance(() => {
//     if (!n.has(3)) n.add(3)
//   }),
//   measurePerformance(() => {
//     n.add(3)
//   }),
// )
// console.log(
//   measurePerformance(() => {
//     const x = random(-10_000, 10_000)
//     const y = random(-10_000, 10_000)
//     Math.sqrt(x * x + y * y) // win lol "modern math apis" ahahaha
//   }),
//   measurePerformance(() => {
//     const x = random(-10_000, 10_000)
//     const y = random(-10_000, 10_000)
//     Math.hypot(x, y)
//   }),
// )
