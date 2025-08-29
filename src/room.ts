/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { signal, UUID } from '@softsky/utils'

import Vector2 from './physics/body/vector2'

export type Device = {
  motion?: [number, number, number]
  rotationRate?: [number, number, number]
  rotation?: [number, number, number]
  touchStart?: Vector2
  touch?: Vector2
  size?: Vector2
}

enum RoomEvents {
  ROOM = 'r',
  ROTATION = 'a',
  MOTION = 'm',
  TOUCH = 't',
  TOUCH_START = 'y',
  TOUCH_END = 'e',
  SIZE = 's',
}

export class Room {
  public socket?: WebSocket
  public connected = signal(false)

  public connect(roomId = UUID()) {
    this.connected(false)
    this.socket?.close()
    this.socket = new WebSocket(
      `ws://${document.location.hostname}:54345?&room=${roomId}`,
    )
    this.socket.addEventListener('open', () => {
      setTimeout(() => this.connected(true), 1000)
    })
    this.socket.addEventListener('close', () => {
      this.connected(false)
      setTimeout(() => {
        this.connect()
      }, 5000)
    })
    this.socket.addEventListener('error', (error) => {
      this.connected(false)
      console.error(error)
      setTimeout(() => {
        this.connect()
      }, 5000)
    })
  }
}

export class RoomDevice extends Room {
  protected runOnDestroy: (() => unknown)[] = []

  public constructor() {
    super()
    this.registerEvent(globalThis, 'devicemotion', ((
      event: DeviceMotionEvent,
    ) => {
      this.socket?.send(
        `${RoomEvents.MOTION},${event.acceleration?.x ?? 0},${
          event.acceleration?.y ?? 0
        },${event.acceleration?.z ?? 0},${
          event.rotationRate?.alpha ?? 0
        },${event.rotationRate?.beta ?? 0},${event.rotationRate?.gamma ?? 0}`,
      )
    }) as any)
    this.registerEvent(globalThis, 'deviceorientation', ((
      event: DeviceOrientationEvent,
    ) => {
      this.socket?.send(
        `${RoomEvents.ROTATION},${event.alpha ?? 0},${event.beta ?? 0},${event.gamma ?? 0}`,
      )
    }) as any)
    this.registerEvent(document, 'touchstart', ((event: TouchEvent) => {
      this.socket?.send(
        `${RoomEvents.TOUCH},${event.touches[0]?.clientX ?? 0},${event.touches[0]?.clientY ?? 0}`,
      )
    }) as any)
    this.registerEvent(document, 'touchmove', ((event: TouchEvent) => {
      this.socket?.send(
        `${RoomEvents.TOUCH},${event.touches[0]?.clientX ?? 0},${event.touches[0]?.clientY ?? 0}`,
      )
    }) as any)
    this.registerEvent(document, 'touchend', ((event: TouchEvent) => {
      this.socket?.send(
        `${RoomEvents.TOUCH_END},${event.touches[0]?.clientX ?? 0},${event.touches[0]?.clientY ?? 0}`,
      )
    }) as any)
  }

  public connect(roomId?: string) {
    super.connect(roomId)
    this.socket?.addEventListener('open', () => {
      this.socket?.send(`size,${window.innerWidth},${window.innerHeight}`)
    })
  }

  public destroy() {
    this.socket?.close()
    this.socket = undefined
    for (const function_ of this.runOnDestroy) function_()
  }

  protected registerEvent(
    target: EventTarget,
    name: string,
    function_: (event: Event) => unknown,
    passive = true,
  ) {
    target.addEventListener(name, function_, {
      passive,
    })
    this.runOnDestroy.push(() => {
      target.removeEventListener(name, function_)
    })
  }
}

export class RoomMain extends Room {
  public devices: Device[] = new Array(2).fill(undefined).map(() => ({}))

  public connect(roomId?: string) {
    super.connect(roomId)
    this.socket?.addEventListener('message', ({ data }) => {
      if (typeof data !== 'string') return
      this.handleMessage(...(data.split(',') as [string, string]))
    })
  }

  protected handleMessage(from: string, event: string, ...data: string[]) {
    const member = this.devices[+from - 1]!
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (from !== 's' && !member) return
    switch (event as RoomEvents) {
      case RoomEvents.ROOM: {
        this.connected(true)
        break
      }
      case RoomEvents.MOTION: {
        member.motion = [+data[0]!, +data[1]!, +data[2]!]
        member.rotationRate = [+data[3]!, +data[4]!, +data[5]!]

        break
      }
      case RoomEvents.ROTATION: {
        member.rotation = [+data[0]!, +data[1]!, +data[2]!]
        break
      }
      case RoomEvents.TOUCH: {
        member.touch = new Vector2(+data[0]!, +data[1]!)
        break
      }
      case RoomEvents.TOUCH_START: {
        member.touchStart = new Vector2(+data[0]!, +data[1]!)
        member.touch = new Vector2(+data[0]!, +data[1]!)
        break
      }
      case RoomEvents.TOUCH_END: {
        delete member.touch
        delete member.touchStart
        break
      }
      case RoomEvents.SIZE: {
        member.size = new Vector2(+data[0]!, +data[1]!)
        break
      }
    }
  }
}

export const room =
  window.innerHeight > window.innerWidth ? new RoomDevice() : new RoomMain()
