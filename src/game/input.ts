import Game from './game'
import Vector2 from './physics/body/vector2'
import { Cleanuppable, Tickable, Ticker } from './ticker'

export default class Input implements Tickable, Cleanuppable {
  public move = new Vector2()
  public look = new Vector2()
  public priority = 10_000
  public gamepads: Gamepad[] = []
  public isGamepad = false
  private mapping = {
    KeyW: 'up',
    ArrowUp: 'up',
    g12: 'up',
    KeyS: 'down',
    ArrowDown: 'down',
    g13: 'down',
    KeyD: 'right',
    ArrowRight: 'right',
    g15: 'right',
    KeyA: 'left',
    ArrowLeft: 'left',
    g14: 'left',
    KeyE: 'use',
    Enter: 'use',
    g0: 'use',
    Escape: 'menu',
    g9: 'menu',
    m0: 'main',
    g5: 'main',
    m3: 'sub',
    g4: 'sub',
    ShiftLeft: 'run',
    g6: 'run',
  } as Record<string, string | undefined>

  private pressedKeys = new Map<string, number>()
  private toRemove = new Set<string>()

  public constructor(
    protected game: Game,
    public parent: Ticker,
  ) {
    this.gamepads = navigator.getGamepads().filter(Boolean) as Gamepad[]
    globalThis.addEventListener('contextmenu', (event) => {
      event.preventDefault()
    })
    globalThis.addEventListener('keydown', this.onKeydown.bind(this), {
      passive: true,
    })
    globalThis.addEventListener('keyup', this.onKeyup.bind(this), {
      passive: true,
    })
    this.game.canvas.addEventListener(
      'mousemove',
      this.onMousemove.bind(this),
      {
        passive: true,
      },
    )
    this.game.canvas.addEventListener(
      'mousedown',
      this.onMousedown.bind(this),
      {
        passive: true,
      },
    )
    this.game.canvas.addEventListener('mouseup', this.onMouseup.bind(this), {
      passive: true,
    })
  }

  public getTicks(key: string) {
    return this.pressedKeys.get(key)
  }

  public has(key: string) {
    return this.pressedKeys.has(key)
  }

  public tick(): void {
    for (const k of this.toRemove)
      if (this.pressedKeys.get(k)! > 1) {
        this.pressedKeys.delete(k)
        this.toRemove.delete(k)
      }
    for (const [k, v] of this.pressedKeys.entries())
      this.pressedKeys.set(k, v + 1)
    this.move.x = 0
    this.move.y = 0
    if (this.pressedKeys.has('up')) this.move.y -= 1
    if (this.pressedKeys.has('down')) this.move.y += 1
    if (this.pressedKeys.has('right')) this.move.x += 1
    if (this.pressedKeys.has('left')) this.move.x -= 1
    this.tickGamepads()
    this.move.normalize(true)
  }

  public cleanup() {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    globalThis.removeEventListener('keydown', this.onKeydown)
    // eslint-disable-next-line @typescript-eslint/unbound-method
    globalThis.removeEventListener('keyup', this.onKeyup)
    this.game.canvas.removeEventListener(
      'mousemove',
      // eslint-disable-next-line @typescript-eslint/unbound-method
      this.onMousemove,
    )
    this.game.canvas.removeEventListener(
      'mousedown',
      // eslint-disable-next-line @typescript-eslint/unbound-method
      this.onMousedown,
    )
    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.game.canvas.removeEventListener('mouseup', this.onMouseup)
  }

  public checkForKeyPlusRepeat(key: string) {
    const t = this.pressedKeys.get(key) ?? 0
    return t === 1 || t > 30
  }

  public vibrate(power: number, duration: number) {
    const gamepads = navigator.getGamepads()
    for (let index = 0; index < gamepads.length; index++) {
      const gamepad = gamepads[index]
      if (!gamepad) continue
      console.log('vibrate', gamepad.vibrationActuator)
      void gamepad.vibrationActuator.playEffect('dual-rumble', {
        strongMagnitude: power,
        duration,
      })
    }
  }

  private tickGamepads() {
    const gamepads = navigator.getGamepads().filter(Boolean) as Gamepad[]
    for (let index = 0; index < gamepads.length; index++) {
      const gamepad = gamepads[index]
      if (!gamepad?.connected) continue
      // if (gamepad.buttons[12]) this.move.y += 1;
      // if (gamepad.buttons[13]) this.move.y -= 1;
      // if (gamepad.buttons[15]) this.move.x += 1;
      // if (gamepad.buttons[14]) this.move.x -= 1;
      if (Math.abs(gamepad.axes[0]!) > 0.2) this.move.x = gamepad.axes[0]!
      if (Math.abs(gamepad.axes[1]!) > 0.2) this.move.y = gamepad.axes[1]!
      if (Math.abs(gamepad.axes[2]!) > 0.2) this.look.x = gamepad.axes[2]!
      if (Math.abs(gamepad.axes[3]!) > 0.2) this.look.y = gamepad.axes[3]!
      for (let index = 0; index < gamepad.buttons.length; index++) {
        const id = this.mapping[index.toString()]
        if (!id) continue
        if (gamepad.buttons[index]!.pressed) {
          this.isGamepad = true
          this.pressedKeys.set(id, 0)
          this.toRemove.delete(id)
        }
        else this.toRemove.add(id)
      }
    }
  }

  private onKeydown(event: KeyboardEvent) {
    const id = this.mapping[event.code]
    if (!id) return
    this.isGamepad = false
    if (!this.pressedKeys.has(id)) this.pressedKeys.set(id, 0)
    this.toRemove.delete(id)
  }

  private onKeyup(event: KeyboardEvent) {
    const id = this.mapping[event.code]
    if (!id) return
    this.toRemove.add(id)
  }

  private onMousemove(event: MouseEvent) {
    this.look.x
      = 1 - ((event.offsetX * window.devicePixelRatio) / this.game.canvas.width) * 2
    this.look.y
      = 1 - ((event.offsetY * window.devicePixelRatio) / this.game.canvas.height) * 2
  }

  private onMousedown(event: MouseEvent) {
    const id = this.mapping['m' + event.button]
    if (!id) return
    this.pressedKeys.set(id, 0)
  }

  private onMouseup(event: MouseEvent) {
    const id = this.mapping['m' + event.button]
    if (!id) return
    this.toRemove.add(id)
  }
}
