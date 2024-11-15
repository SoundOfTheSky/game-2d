export type Tickable = {
  parent?: Ticker
  tick(deltaTime: number): void
  priority: number
} & Partial<Cleanuppable>

export type Cleanuppable = {
  cleanup(): void
}

export class Ticker implements Tickable {
  public constructor(
    public parent?: Ticker,
    public priority = 0,
  ) {}

  public tickables: Tickable[] = []

  public cleanup(): void {
    for (let index = 0; index < this.tickables.length; index++) this.tickables[index]!.cleanup?.()
  }

  public tick(deltaTime: number) {
    for (let index = 0; index < this.tickables.length; index++) this.tickables[index]!.tick(deltaTime)
  }

  public addTickable<T extends Tickable>(tickable: T): T {
    tickable.parent = this
    let index = this.tickables.findIndex(x => x.priority < tickable.priority)
    if (index === -1) index = this.tickables.length
    this.tickables.splice(index, 0, tickable)
    return tickable
  }

  public removeTickable(tickable: Tickable) {
    const index = this.tickables.indexOf(tickable)
    if (index !== -1) this.tickables.splice(index, 1)
  }

  public sortTickables() {
    this.tickables.sort((a, b) => a.priority - b.priority)
  }
}
