import { parseInt } from '@softsky/utils'

import { InputComponent } from '../components/input.component'
import { VelocityComponent } from '../components/velocity.component'
import { ECSQuery } from '../ecs/query'
import { ECSSystem } from '../ecs/system'
import ECSWorld from '../ecs/world'

import Vector2 from './physics/body/vector2'

/**
 * On key press create key events
 *
 * Events can wait for 60ms (~4 frames) to be used.
 * For example if player can't dash, but will be able to dash in 60ms, he will.
 *
 * Every key no matter how fast it pressed is registered. Even if it's less than a frame.
 * But keypress every frame will be registered as one long hold.
 *
 * move: Vector2 and look: Vector2 are helper vectors and based on simple inputs
 */

export enum Key {
  UP,
  DOWN,
  LEFT,
  RIGHT,
  /** Then user interacts with world or ui */
  INTERACT,
  /** Close anything/open menu */
  ESCAPE,
  /** Movement ability */
  MOVE,
}

export class InputSystem extends ECSSystem {
  public priority = 100
  public move = new Vector2()
  public pressedKeys = new Map<Key, number>()
  public sensors = {
    acceleration: {
      x: 0,
      y: 0,
      z: 0,
    },
    rotationSpeed: {
      alpha: 0,
      gamma: 0,
      beta: 0,
    },
    rotation: {
      alpha: 0,
      gamma: 0,
      beta: 0,
    },
  }
  public added = new Set<Key>()
  public deleted = new Set<Key>()
  public entities$
  public socket
  public touch: Vector2 | undefined
  public phoneSize = new Vector2()

  protected toRemove = new Set<Key>()
  protected keyMapping = {
    KeyW: [Key.UP],
    KeyS: [Key.DOWN],
    KeyD: [Key.RIGHT],
    KeyA: [Key.LEFT],
    KeyE: [Key.INTERACT],
    Enter: [Key.INTERACT],
    Escape: [Key.ESCAPE],
    Space: [Key.MOVE],
  } as Record<string, Key[] | undefined>

  public constructor(world: ECSWorld) {
    super(world)
    this.socket = new WebSocket(`ws://${document.location.hostname}:54345`)
    this.entities$ = new ECSQuery(world, [InputComponent])
    this.registerEvent(
      globalThis,
      'contextmenu',
      (event) => {
        event.preventDefault()
      },
      false,
    )
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.registerEvent(globalThis, 'keydown', this.onKeydown.bind(this) as any)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.registerEvent(globalThis, 'keyup', this.onKeyup.bind(this) as any)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.registerEvent(this.socket, 'message', this.onMessage.bind(this) as any)
  }

  public tick() {
    for (const k of this.toRemove) {
      this.pressedKeys.delete(k)
      this.deleted.add(k)
    }
    this.toRemove.clear()
    for (const [k, v] of this.pressedKeys)
      this.pressedKeys.set(k, v + this.world.deltaTime)
    this.move.x = 0
    this.move.y = 0
    if (this.pressedKeys.has(Key.UP)) this.move.y -= 1
    if (this.pressedKeys.has(Key.DOWN)) this.move.y += 1
    if (this.pressedKeys.has(Key.RIGHT)) this.move.x += 1
    if (this.pressedKeys.has(Key.LEFT)) this.move.x -= 1
    this.move.normalize(true)
    for (const entity of this.entities$.matches) {
      const inputComponent = entity.components.get(InputComponent)!
      const velocityComponent = entity.components.get(VelocityComponent)
      // === Vectors to movement ===
      if (velocityComponent) {
        if (inputComponent.data.moveToVelocity) {
          velocityComponent.data.velocity.x = this.move.x
          velocityComponent.data.velocity.y = this.move.y
        } else if (
          inputComponent.data.moveToAcceleration &&
          velocityComponent.data.acceleration
        ) {
          velocityComponent.data.acceleration.x = this.move.x
          velocityComponent.data.acceleration.y = this.move.y
        }
      }

      // === Buttons to abilities ===
      inputComponent.data.startAbility.clear()
      inputComponent.data.stopAbility.clear()
      for (const [key, ability] of inputComponent.data.abilities) {
        if (this.added.has(key)) inputComponent.data.startAbility.add(ability)
        else if (this.deleted.has(key))
          inputComponent.data.stopAbility.add(ability)
      }
    }
    this.added.clear()
    this.deleted.clear()
  }

  public checkForKeyPlusRepeat(key: Key) {
    return (
      this.added.has(key) ||
      this.world.time - (this.pressedKeys.get(key) ?? 0) > 500
    )
  }

  protected onKeydown(event: KeyboardEvent) {
    if (!event.repeat) this.setByKey(event.code)
  }

  protected onKeyup(event: KeyboardEvent) {
    if (!event.repeat) this.deleteByKey(event.code)
  }

  protected setByKey(key: string) {
    const ids = this.keyMapping[key]
    if (!ids) return
    for (let index = 0; index < ids.length; index++) {
      const id = ids[index]!
      if (!this.pressedKeys.has(id)) this.pressedKeys.set(id, this.world.time)
      this.added.add(id)
      this.toRemove.delete(id)
    }
  }

  protected deleteByKey(key: string) {
    const ids = this.keyMapping[key]
    if (!ids) return
    for (let index = 0; index < ids.length; index++)
      this.toRemove.add(ids[index]!)
  }

  protected onMessage(event: MessageEvent) {
    if (typeof event.data !== 'string') return
    const index = event.data.indexOf(',')
    const eventName = index === -1 ? event.data : event.data.slice(0, index)
    const _body = index === -1 ? undefined : event.data.slice(index + 1)
    switch (eventName) {
      case 'sensors': {
        const body = _body!.split(',').map((x) => parseInt(x))
        this.sensors.acceleration.x = body[0]!
        this.sensors.acceleration.y = body[1]!
        this.sensors.acceleration.z = body[2]!
        this.sensors.rotationSpeed.alpha = body[3]!
        this.sensors.rotationSpeed.beta = body[4]!
        this.sensors.rotationSpeed.gamma = body[5]!
        break
      }
      case 'rotation': {
        const body = _body!.split(',').map((x) => parseInt(x))
        this.sensors.rotation.alpha = body[0]!
        this.sensors.rotation.beta = body[1]!
        this.sensors.rotation.gamma = body[2]!
        break
      }
      case 'touchStart': {
        const body = _body!.split(',').map((x) => parseInt(x))
        this.touch = new Vector2(body[0], body[1])
        break
      }
      case 'touchMove': {
        const body = _body!.split(',').map((x) => parseInt(x))
        this.touch!.x = body[0]!
        this.touch!.y = body[1]!
        break
      }
      case 'touchEnd': {
        this.touch = undefined
        break
      }
      case 'size': {
        const body = _body!.split(',').map((x) => parseInt(x))
        this.phoneSize.x = body[0]!
        this.phoneSize.y = body[1]!
      }
    }
  }
}
