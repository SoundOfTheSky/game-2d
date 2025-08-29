import { room, RoomMain } from '@/room'

import { ECSQuery } from '../../ecs/query'
import { ECSSystem } from '../../ecs/system'
import ECSWorld from '../../ecs/world'
import Vector2 from '../../physics/body/vector2'
import { InputComponent } from '../components/input.component'
import { VelocityComponent } from '../components/velocity.component'

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

/** Those actions mostly just to easily determine some actions. */
export enum DeviceAction {
  // Swipe
  SWIPE_DOWN,
  SWIPE_DOWN_LEFT,
  SWIPE_DOWN_RIGHT,
  SWIPE_LEFT,
  SWIPE_RIGHT,
  SWIPE_UP,
  SWIPE_UP_LEFT,
  SWIPE_UP_RIGHT,
  // Tap
  TAP,
  TAP_1,
  TAP_2,
  TAP_3,
  TAP_4,
  // Sides-Swing
  SWING_DOWN,
  SWING_DOWN_LEFT,
  SWING_DOWN_RIGHT,
  SWING_LEFT,
  SWING_RIGHT,
  SWING_UP,
  SWING_UP_LEFT,
  SWING_UP_RIGHT,
}

export type DeviceStateActions = {
  actions: Map<DeviceAction, number>
  actionAdded: Set<DeviceAction>
  actionDeleted: Set<DeviceAction>
  actionsToRemove: Set<DeviceAction>
  move: Vector2
  lastSwingDirection?: DeviceAction
  lastSwipeDirection?: DeviceAction
}

export class InputSystem extends ECSSystem {
  public priority = 100
  public deviceStates: DeviceStateActions[] = new Array(2)
    .fill(undefined)
    .map(() => ({
      actions: new Map(),
      actionAdded: new Set(),
      actionDeleted: new Set(),
      actionsToRemove: new Set(),
      move: new Vector2(),
    }))
  public entities$ = new ECSQuery(this.world, [InputComponent])

  public constructor(world: ECSWorld) {
    super(world)
    this.registerEvent(
      globalThis,
      'contextmenu',
      (event) => {
        event.preventDefault()
      },
      false,
    )
  }

  public tick() {
    // Check device actions
    for (let index = 0; index < this.deviceStates.length; index++) {
      const device = (room as RoomMain).devices[index]!
      const state = this.deviceStates[index]!

      // Swing
      const swingDirection =
        device.motion &&
        this.getSwingDirection(new Vector2(device.motion[0], device.motion[1]))
      if (state.lastSwingDirection !== swingDirection) {
        if (state.lastSwingDirection)
          state.actionsToRemove.delete(state.lastSwingDirection)
        if (swingDirection) {
          state.actionAdded.add(swingDirection)
          state.actions.set(swingDirection, this.world.time)
        }
        state.lastSwingDirection = swingDirection
      }

      // Swipe and move
      if (device.touch && device.touchStart && device.size) {
        state.move.x =
          ((device.touch.x - device.touchStart.x) / device.size.x) * 3
        state.move.y =
          ((device.touch.y - device.touchStart.y) / device.size.x) * 3
        if (state.move.x > 1) state.move.x = 1
        if (state.move.y > 1) state.move.y = 1
        if (state.move.x < -1) state.move.x = -1
        if (state.move.y < -1) state.move.y = -1
        const swipeDirection = this.getSwipeDirection(state.move)
        if (state.lastSwipeDirection !== swipeDirection) {
          if (state.lastSwipeDirection)
            state.actionsToRemove.delete(state.lastSwipeDirection)
          if (swipeDirection) {
            state.actionAdded.add(swipeDirection)
            state.actions.set(swipeDirection, this.world.time)
          }
          state.lastSwipeDirection = swipeDirection
        }
      } else {
        state.move.x = 0
        state.move.y = 0
      }
    }

    // Apply move to entities
    for (const entity of this.entities$.matches) {
      const inputComponent = entity.components.get(InputComponent)!
      const velocityComponent = entity.components.get(VelocityComponent)
      // Vectors to movement
      if (velocityComponent) {
        if (inputComponent.data.moveToVelocity !== undefined) {
          velocityComponent.data.velocity.x =
            this.deviceStates[inputComponent.data.moveToVelocity]?.move.x ?? 0
          velocityComponent.data.velocity.y =
            this.deviceStates[inputComponent.data.moveToVelocity]?.move.y ?? 0
        }
        if (
          inputComponent.data.moveToAcceleration !== undefined &&
          velocityComponent.data.acceleration
        ) {
          velocityComponent.data.acceleration.x =
            this.deviceStates[inputComponent.data.moveToAcceleration]?.move.x ??
            0
          velocityComponent.data.acceleration.y =
            this.deviceStates[inputComponent.data.moveToAcceleration]?.move.y ??
            0
        }
      }
    }
  }

  protected getSwingDirection(vector: Vector2): DeviceAction | undefined {
    if (vector.distance() < 10) return
    const angle = vector.angle()
    if (angle >= -22.5 && angle < 22.5) return DeviceAction.SWING_RIGHT
    if (angle >= 22.5 && angle < 67.5) return DeviceAction.SWING_DOWN_RIGHT
    if (angle >= 67.5 && angle < 112.5) return DeviceAction.SWING_DOWN
    if (angle >= 112.5 && angle < 157.5) return DeviceAction.SWING_DOWN_LEFT
    if (angle >= 157.5 || angle < -157.5) return DeviceAction.SWING_LEFT
    if (angle >= -157.5 && angle < -112.5) return DeviceAction.SWING_UP_LEFT
    if (angle >= -112.5 && angle < -67.5) return DeviceAction.SWING_UP
    if (angle >= -67.5 && angle < -22.5) return DeviceAction.SWING_UP_RIGHT
  }

  protected getSwipeDirection(vector: Vector2): DeviceAction | undefined {
    if (vector.distance() < 10) return
    const angle = vector.angle()
    if (angle >= -22.5 && angle < 22.5) return DeviceAction.SWIPE_RIGHT
    if (angle >= 22.5 && angle < 67.5) return DeviceAction.SWIPE_DOWN_RIGHT
    if (angle >= 67.5 && angle < 112.5) return DeviceAction.SWIPE_DOWN
    if (angle >= 112.5 && angle < 157.5) return DeviceAction.SWIPE_DOWN_LEFT
    if (angle >= 157.5 || angle < -157.5) return DeviceAction.SWIPE_LEFT
    if (angle >= -157.5 && angle < -112.5) return DeviceAction.SWIPE_UP_LEFT
    if (angle >= -112.5 && angle < -67.5) return DeviceAction.SWIPE_UP
    if (angle >= -67.5 && angle < -22.5) return DeviceAction.SWIPE_UP_RIGHT
  }
}
