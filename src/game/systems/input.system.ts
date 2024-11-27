import { InputComponent } from '../components/input.component'
import { VelocityComponent } from '../components/velocity.component'
import { ECSQuery } from '../ecs/query'
import { ECSSystem } from '../ecs/system'
import ECSWorld from '../ecs/world'

import Vector2 from './physics/body/vector2'

class InputSystem extends ECSSystem {
  public priority = 100
  public move = new Vector2()
  public look = new Vector2()
  public gamepads: Gamepad[] = []
  public isGamepad = false
  public pressedKeys = new Map<string, number>()
  public added = new Set<string>()
  public deleted = new Set<string>()
  public entities$

  private toRemove = new Set<string>()
  private keyMapping = {
    KeyW: ['up'],
    ArrowUp: ['up'],
    g12: ['up'],
    KeyS: ['down'],
    ArrowDown: ['down'],
    g13: ['down'],
    KeyD: ['right'],
    ArrowRight: ['right'],
    g15: ['right'],
    KeyA: ['left'],
    ArrowLeft: ['left'],
    g14: ['left'],
    KeyE: ['use'],
    Enter: ['use'],
    g0: ['use'],
    Escape: ['menu'],
    g9: ['menu'],
    m0: ['main'],
    g5: ['main'],
    m3: ['sub'],
    g4: ['sub'],
    ShiftLeft: ['move'],
    g6: ['move'],
  } as Record<string, string[] | undefined>

  public constructor(world: ECSWorld) {
    super(world)
    this.entities$ = new ECSQuery(world, [InputComponent])
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
    document.addEventListener(
      'mousemove',
      this.onMousemove.bind(this),
      {
        passive: true,
      },
    )
    document.addEventListener(
      'mousedown',
      this.onMousedown.bind(this),
      {
        passive: true,
      },
    )
    document.addEventListener('mouseup', this.onMouseup.bind(this), {
      passive: true,
    })
  }

  public update() {
    this.added.clear()
    this.deleted.clear()
    for (const k of this.toRemove) {
      this.pressedKeys.delete(k)
      this.deleted.add(k)
    }
    this.toRemove.clear()
    for (const [k, v] of this.pressedKeys)
      this.pressedKeys.set(k, v + this.world.deltaTime)
    this.move.x = 0
    this.move.y = 0
    if (this.pressedKeys.has('up')) this.move.y -= 1
    if (this.pressedKeys.has('down')) this.move.y += 1
    if (this.pressedKeys.has('right')) this.move.x += 1
    if (this.pressedKeys.has('left')) this.move.x -= 1
    this.updateGamepads()
    this.move.normalize(true)

    for (const entity of this.entities$.matches) {
      const inputComponent = entity.components.get(InputComponent)!
      const velocityComponent = entity.components.get(VelocityComponent)!
      if (inputComponent.data.move) {
        velocityComponent.data.velocity.x = this.move.x
        velocityComponent.data.velocity.y = this.move.y
      }
    }
  }

  public checkForKeyPlusRepeat(key: string) {
    return this.added.has(key) || this.world.time - (this.pressedKeys.get(key) ?? 0) > 500
  }

  public vibrate(power: number, duration: number) {
    const gamepads = navigator.getGamepads()
    for (let index = 0; index < gamepads.length; index++) {
      const gamepad = gamepads[index]
      if (!gamepad) continue
      void gamepad.vibrationActuator.playEffect('dual-rumble', {
        strongMagnitude: power,
        duration,
      })
    }
  }

  private updateGamepads() {
    const gamepads = navigator.getGamepads().filter(Boolean) as Gamepad[]
    for (let index = 0; index < gamepads.length; index++) {
      const gamepad = gamepads[index]
      if (!gamepad?.connected) continue
      if (Math.abs(gamepad.axes[0]!) > 0.2) this.move.x = gamepad.axes[0]!
      if (Math.abs(gamepad.axes[1]!) > 0.2) this.move.y = gamepad.axes[1]!
      if (Math.abs(gamepad.axes[2]!) > 0.2) this.look.x = gamepad.axes[2]!
      if (Math.abs(gamepad.axes[3]!) > 0.2) this.look.y = gamepad.axes[3]!
      for (let index = 0; index < gamepad.buttons.length; index++) {
        if (gamepad.buttons[index]!.pressed) {
          this.isGamepad = true
          this.setByKey(index.toString())
        }
        else this.deleteByKey(index.toString())
      }
    }
  }

  private onKeydown(event: KeyboardEvent) {
    this.isGamepad = false
    this.setByKey(event.code)
  }

  private onKeyup(event: KeyboardEvent) {
    this.deleteByKey(event.code)
  }

  private onMousemove(event: MouseEvent) {
    this.look.x = 1 - event.offsetX / document.body.clientWidth * 2
    this.look.y = 1 - event.offsetY / document.body.clientHeight * 2
  }

  private onMousedown(event: MouseEvent) {
    this.setByKey('m' + event.button)
  }

  private onMouseup(event: MouseEvent) {
    this.deleteByKey('m' + event.button)
  }

  private setByKey(key: string) {
    const ids = this.keyMapping[key]
    if (!ids) return
    for (let index = 0; index < ids.length; index++) {
      const id = ids[index]!
      if (!this.pressedKeys.has(id)) this.pressedKeys.set(id, this.world.time)
      this.added.add(id)
      this.toRemove.delete(id)
    }
  }

  private deleteByKey(key: string) {
    const ids = this.keyMapping[key]
    if (!ids) return
    for (let index = 0; index < ids.length; index++)
      this.toRemove.add(ids[index]!)
  }
}
export default InputSystem
