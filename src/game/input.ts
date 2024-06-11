import Game from './game';
import Vector2 from './physics/body/vector2';
import { Cleanuppable, Tickable, Ticker } from './ticker';

export default class Input implements Tickable, Cleanuppable {
  public move = new Vector2();
  public look = new Vector2();
  public priority = 10000;
  public gamepads: Gamepad[] = [];
  public isGamepad = false;
  private mapping = {
    w: 'up',
    ArrowUp: 'up',
    g12: 'up',
    s: 'down',
    ArrowDown: 'down',
    g13: 'down',
    d: 'right',
    ArrowRight: 'right',
    g15: 'right',
    a: 'left',
    ArrowLeft: 'left',
    g14: 'left',
    z: 'use',
    e: 'use',
    Enter: 'use',
    g0: 'use',
    Escape: 'menu',
    menu: 'menu',
    g9: 'menu',
    m0: 'main',
    g4: 'main',
    m3: 'sub',
    g5: 'sub',
  } as Record<string, string | undefined>;
  private pressedKeys = new Map<string, number>();
  private toRemove = new Set<string>();

  public constructor(
    protected game: Game,
    public parent: Ticker,
  ) {
    this.gamepads = navigator.getGamepads().filter(Boolean) as Gamepad[];
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', this.onKeydown.bind(this), {
      passive: true,
    });
    window.addEventListener('keyup', this.onKeyup.bind(this), {
      passive: true,
    });
    window.addEventListener('gamepadconnected', this.onGamepadConnected.bind(this), {
      passive: true,
    });
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected.bind(this), {
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
    this.move.x = 0;
    this.move.y = 0;
    if (this.pressedKeys.has('up')) this.move.y -= 1;
    if (this.pressedKeys.has('down')) this.move.y += 1;
    if (this.pressedKeys.has('right')) this.move.x += 1;
    if (this.pressedKeys.has('left')) this.move.x -= 1;
    this.tickGamepads();
    this.move.normalize();
  }

  public cleanup() {
    window.removeEventListener('gamepadconnected', this.onGamepadConnected.bind(this));
    window.removeEventListener('gamepaddisconnected', this.onGamepadDisconnected.bind(this));
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

  private tickGamepads() {
    for (let i = 0; i < this.gamepads.length; i++) {
      const gamepad = this.gamepads[i];
      if (!gamepad.connected) continue;
      if (gamepad.buttons[12]) this.move.y += 1;
      if (gamepad.buttons[13]) this.move.y -= 1;
      if (gamepad.buttons[15]) this.move.x += 1;
      if (gamepad.buttons[14]) this.move.x -= 1;
      this.move.x = gamepad.axes[0];
      this.move.y = gamepad.axes[1];
      this.look.x = gamepad.axes[2];
      this.look.y = gamepad.axes[3];
      for (let j = 0; j < gamepad.buttons.length; j++) {
        const id = this.mapping[j.toString()];
        if (!id) continue;
        if (gamepad.buttons[j].pressed) {
          this.isGamepad = true;
          this.pressedKeys.set(id, 0);
          this.toRemove.delete(id);
        } else this.toRemove.add(id);
      }
    }
  }

  private onKeydown(e: KeyboardEvent) {
    const id = this.mapping[e.key];
    if (!id) return;
    this.isGamepad = false;
    if (!this.pressedKeys.has(id)) this.pressedKeys.set(id, 0);
    this.toRemove.delete(id);
  }

  private onKeyup(e: KeyboardEvent) {
    const id = this.mapping[e.key];
    if (!id) return;
    this.toRemove.add(id);
  }

  private onMousemove(e: MouseEvent) {
    this.look.x = (e.offsetX * window.devicePixelRatio) / this.game.canvas.width;
    this.look.y = (e.offsetY * window.devicePixelRatio) / this.game.canvas.height;
  }

  private onMousedown(e: MouseEvent) {
    const id = this.mapping['m' + e.button];
    if (!id) return;
    this.pressedKeys.set(id, 0);
  }

  private onMouseup(e: MouseEvent) {
    const id = this.mapping['m' + e.button];
    if (!id) return;
    this.toRemove.add(id);
  }

  private onGamepadConnected(e: GamepadEvent) {
    this.gamepads.push(e.gamepad);
  }

  private onGamepadDisconnected(e: GamepadEvent) {
    this.gamepads.splice(this.gamepads.indexOf(e.gamepad), 1);
  }
}
