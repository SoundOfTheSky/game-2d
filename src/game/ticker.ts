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
/**
 * Priority:
 * 0 - Default
 * 1 - bg
 * 2 - bg decor
 * 3 - player if behind
 * 4 - stuff plane
 * 5 - stuff plane decor
 * 6 - player if in front
 * 7 - fg
 * 8 - fg decor
 * 9-19 - idk just in case
 * 0 - 20 - Image rendering
 * 31 - HUD bg
 * 32 - HUD fg
 * 33 - Pause HUD bg
 * 34 - Pause hud fg
 *
 * 100 - Level (Above images)
 * 101 - Player (Above level)
 *
 * 10000 - Input
 */
