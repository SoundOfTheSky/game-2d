import { ECSSystem } from '../../ecs/system'
import {
  setECSTicksTimeout,
  setECSTimeout,
} from '../generator-systems/set-timeout'

import UISystem from './ui/ui.system'

export type GetResourceOptions = {
  time?: number
  ticks?: number
  onLoad?: (data: unknown) => unknown
  customFetch?: () => Promise<unknown>
}
export class StreamingSystem extends ECSSystem {
  protected cache = new Map<string, unknown>()

  /** Basically fetch. Returns undefined until loaded. */
  public getResource(file: string, options?: GetResourceOptions): unknown {
    const item = this.cache.get(file)
    if (item) return item

    let promise: Promise<unknown>
    if (options?.customFetch) promise = options.customFetch()
    else if (
      file.endsWith('.webp') ||
      file.endsWith('.png') ||
      file.endsWith('.jpg')
    )
      promise = new Promise<HTMLImageElement>((resolve, reject) => {
        const img = document.createElement('img')
        img.src = file
        img.addEventListener('load', () => {
          resolve(img)
        })
        img.addEventListener('onerror', reject)
      })
    else if (
      file.endsWith('.json') ||
      file.endsWith('.tmj') ||
      file.endsWith('.tsj')
    )
      promise = fetch(file).then((x) => x.json())
    else promise = fetch(file).then((x) => x.text())

    promise
      .then((x) => {
        this.setCache(x, file, options)
      })
      .catch(() => {
        this.handleError(file)
      })
  }

  protected setCache(
    data: unknown,
    file: string,
    options?: GetResourceOptions,
  ) {
    if (options) {
      if (options.time)
        setECSTimeout(
          this.world,
          () => {
            this.cache.delete(file)
          },
          options.time,
        )
      if (options.ticks)
        setECSTicksTimeout(
          this.world,
          () => {
            this.cache.delete(file)
          },
          options.ticks,
        )
      options.onLoad?.(data)
    }
    this.cache.set(file, data)
  }

  protected handleError(file: string) {
    this.world.systemMap
      .get(UISystem)!
      .printValues.set('ERROR', `Failed to load ${file}`)
  }
}
