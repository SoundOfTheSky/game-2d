import { Constructor, pushToSorted, removeFromArray } from '@softsky/utils'

import ECSWorld from './world'

/**
 * ECSSystem once created will be called by a world every tick.
 * Here you should be putting all your logic.
 */
export class ECSSystem {
  /** Bigger the priority, sooner it will be called */
  public priority = 0
  protected runOnDestroy: (() => unknown)[] = []

  public constructor(public world: ECSWorld) {
    pushToSorted(this.world.systems, this, (x) => this.priority - x.priority)
    this.world.systemMap.set(this.constructor as Constructor<ECSSystem>, this)
  }

  /** Function that will be called every tick */

  public tick(): void {}

  public destroy() {
    removeFromArray(this.world.systems, this)
    this.world.systemMap.delete(this.constructor as Constructor<ECSSystem>)
    for (let index = 0; index < this.runOnDestroy.length; index++)
      this.runOnDestroy[index]!()
  }

  protected registerEvent(
    target: EventTarget,
    name: string,
    function_: (event: Event) => unknown,
    passive = true,
  ) {
    target.addEventListener(name, function_, {
      passive,
    })
    this.runOnDestroy.push(() => {
      target.removeEventListener(name, function_)
    })
  }
}

/**
 * Same as ECSSystem, but will be called every fixed time interval.
 * Use this for physics, animation, etc.
 *
 * @example
 * ```ts
 * class PhysicsSystem extends ECSFixedUpdateSystem {
 *   public fixedUpdate(): void {
 *     // Your physics logic here
 *   }
 * }
 */
export class ECSFixedUpdateSystem extends ECSSystem {
  public leftoverTime = 0
  public timeBetweenUpdates = 16.6

  public tick(): void {
    const accumulatedTime = this.leftoverTime + this.world.deltaTime
    const steps = accumulatedTime / this.timeBetweenUpdates
    this.leftoverTime = accumulatedTime - steps * this.timeBetweenUpdates
    for (let step = 0; step < steps; step++) this.fixedUpdate()
  }

  public fixedUpdate(): void {}
}
