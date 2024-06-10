import Game from './game';
import { Cleanuppable, Tickable, Ticker } from './ticker';

export default class Input implements Tickable, Cleanuppable {
  public mouseX = 0;
  public mouseY = 0;
  private pressedKeys = new Map<string, number>();
  private toRemove = new Set<string>();
  public priority = 10000;

  public constructor(
    protected game: Game,
    public parent: Ticker,
  ) {
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', this.onKeydown.bind(this), {
      passive: true,
    });
    window.addEventListener('keyup', this.onKeyup.bind(this), {
      passive: true,
    });
    this.game.canvas.addEventListener('mousemove', this.onMousemove.bind(this), {
      passive: true,
    });
    this.game.canvas.addEventListener('mousedown', this.onMousedown.bind(this), {
      passive: true,
    });
    this.game.canvas.addEventListener('mouseup', this.onMouseup.bind(this), {
      passive: true,
    });
  }

  public getTicks(key: string) {
    return this.pressedKeys.get(key);
  }

  public has(key: string) {
    return this.pressedKeys.has(key);
  }

  public tick(): void {
    for (const k of this.toRemove)
      if (this.pressedKeys.get(k)! > 1) {
        this.pressedKeys.delete(k);
        this.toRemove.delete(k);
      }
    for (const [k, v] of this.pressedKeys.entries()) this.pressedKeys.set(k, v + 1);
  }

  public cleanup() {
    window.removeEventListener('keydown', this.onKeydown.bind(this));
    window.removeEventListener('keyup', this.onKeyup.bind(this));
    this.game.canvas.removeEventListener('mousemove', this.onMousemove.bind(this));
    this.game.canvas.removeEventListener('mousedown', this.onMousedown.bind(this));
    this.game.canvas.removeEventListener('mouseup', this.onMouseup.bind(this));
  }

  public checkForKeyPlusRepeat(key: string) {
    const t = this.pressedKeys.get(key) ?? 0;
    return t === 1 || t > 30;
  }

  private onKeydown(e: KeyboardEvent) {
    if (!this.pressedKeys.has(e.key)) this.pressedKeys.set(e.key, 0);
    this.toRemove.delete(e.key);
  }

  private onKeyup(e: KeyboardEvent) {
    this.toRemove.add(e.key);
  }

  private onMousemove(e: MouseEvent) {
    this.mouseX = e.offsetX * window.devicePixelRatio;
    this.mouseY = e.offsetY * window.devicePixelRatio;
  }

  private onMousedown(e: MouseEvent) {
    this.pressedKeys.set('m' + e.button, 0);
  }

  private onMouseup(e: MouseEvent) {
    this.toRemove.add('m' + e.button);
  }
}
