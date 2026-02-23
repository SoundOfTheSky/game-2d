import { AnyFunction } from '@softsky/utils'

import ECSWorld from '@/ecs/world'

/**
 * ECS analog of setTimeout. Resolves after set amount of time.
 */
export function setECSTimeout(
  world: ECSWorld,
  handler: AnyFunction,
  time: number,
): void {
  const targetTime = world.time + time
  function* timeoutGenerator(): Generator<void, void, unknown> {
    while (world.time < targetTime) yield
    handler()
  }
  world.generatorSystems.push(timeoutGenerator())
}

/**
 * ECS analog of setTimeout. Resolves after set amount of ticks.
 */
export function setECSTicksTimeout(
  world: ECSWorld,
  handler: AnyFunction,
  ticks: number,
): void {
  function* timeoutGenerator(): Generator<void, void, unknown> {
    while (ticks-- !== 0) yield
    handler()
  }
  world.generatorSystems.push(timeoutGenerator())
}
