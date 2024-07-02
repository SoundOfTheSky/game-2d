export type Tickable = {
  parent?: Ticker;
  tick(deltaTime: number): void;
  priority: number;
} & Partial<Cleanuppable>;

export type Cleanuppable = {
  cleanup(): void;
};

export class Ticker implements Tickable {
  public constructor(
    public parent?: Ticker,
    public priority = 0,
  ) {}

  public tickables: Tickable[] = [];

  public cleanup(): void {
    for (let i = 0; i < this.tickables.length; i++) this.tickables[i].cleanup?.();
  }

  public tick(deltaTime: number) {
    for (let i = 0; i < this.tickables.length; i++) this.tickables[i].tick(deltaTime);
  }

  public addTickable<T extends Tickable>(tickable: T): T {
    tickable.parent = this;
    let i = this.tickables.findIndex((x) => x.priority < tickable.priority);
    if (i === -1) i = this.tickables.length;
    this.tickables.splice(i, 0, tickable);
    return tickable;
  }

  public removeTickable(tickable: Tickable) {
    const i = this.tickables.indexOf(tickable);
    if (i !== -1) this.tickables.splice(i, 1);
  }

  public sortTickables() {
    this.tickables.sort((a, b) => a.priority - b.priority);
  }
}
