import ECSWorld from './world'

/**
 * ECSSystem once created will be called by a world every tick.
 * Here you should be putting all your logic.
 */
export class ECSSystem {
  /** Bigger the priority, sooner it will be called */
  public priority = 0

  public constructor(
    public world: ECSWorld,
  ) {
    let index = this.world.systems.findIndex(x => x.priority < this.priority)
    if (index === -1) index = this.world.systems.length
    this.world.systems.splice(index, 0, this)
  }

  /** Function that will be called every tick */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public update(): void {};
}

export class ECSSystemStepped extends ECSSystem {
  public leftoverTime = 0
  public timeBetweenUpdates = 16.6

  public update(): void {
    const accumulatedTime = this.leftoverTime + this.world.deltaTime
    const steps = accumulatedTime / this.timeBetweenUpdates
    this.leftoverTime = accumulatedTime - (steps * this.timeBetweenUpdates)
    for (let step = 0; step < steps; step++)
      this.updateStepped()
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public updateStepped(): void {}
}
