/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Tuple } from '@softsky/utils'

import { WebGPUBuffer } from './buffer'
import {
  WEBGPU_SCHEMA_UNITS,
  WebGPUSchema,
  WebGPUSchemaArray,
  WebGPUSchemaData,
  WebGPUSchemaUnits,
  WebGPUSchemaUnitsKeys,
} from './schema'

type SchemaToValue<S extends WebGPUSchemaData> =
  S extends WebGPUSchemaArray<infer Schema, any> // If array
    ? readonly SchemaToValue<Schema>[]
    : S extends WebGPUSchema<infer Schema> // If object
      ? { readonly [K in keyof Schema]: SchemaToValue<Schema[K]> }
      : S extends WebGPUSchemaUnitsKeys // If value
        ? WebGPUSchemaUnits[S] extends readonly [
            infer Len extends number,
            any,
            any,
          ]
          ? Tuple<number, Len>
          : never
        : never

/**
 * Allow to create webgpu aligned memory.
 * When working with data please only use direct assingment
 *
 * @example
 * const memory = new WebGPUMemory(new WebGPUSchema({
 *   pos: new WebGPUSchemaArray('vec2f', 32),
 * }))
 * memory.value.pos[1] = 16
 * memory.upload()
 */
export class WebGPUMemory<
  const S extends WebGPUSchemaData,
> extends WebGPUBuffer {
  /**
   * It's a virtual object that is bound to specific addresses in memory.
   * Setting data with anything but `=` will not work.
   * Equality operators on objects will not work as expected.
   * After updating data you have to call `upload()`
   */
  public readonly value: SchemaToValue<S>

  public constructor(
    public schema: S,
    usage: GPUBufferUsageFlags,
  ) {
    super(
      typeof schema === 'string'
        ? WEBGPU_SCHEMA_UNITS[schema as WebGPUSchemaUnitsKeys][1]
        : schema.size,
      usage,
    )
    const createPathProxy = (
      schema: WebGPUSchemaData,
      path = '',
      offset = 0,
    ) => {
      const pad = (align: number) => {
        offset += (align - (offset % align)) % align
      }
      return new Proxy(this, {
        get(target, prop) {
          const property = String(prop)
          const nextPath = path ? `${path}.${property}` : String(prop)
          if (typeof schema === 'string') {
            const [size, align, viewIndex] = WEBGPU_SCHEMA_UNITS[schema]
            const index = +property
            if (isNaN(index) || index < 0 || index >= size) return undefined
            pad(align)
            return target[viewIndex]![offset + index]
          }
          if (schema instanceof WebGPUSchemaArray) {
            const index = +property
            if (isNaN(index) || index < 0 || index >= schema.length)
              return undefined
            pad(schema.align)
            return createPathProxy(
              schema.schema,
              nextPath,
              offset + index * schema.elementSize,
            )
          }
          const fieldOffset = schema.offsets.get(property)
          if (fieldOffset === undefined) return undefined
          pad(schema.align)
          return createPathProxy(
            schema.schema[property],
            nextPath,
            offset + fieldOffset,
          )
        },
        set(target, prop, value) {
          if (typeof schema === 'string') {
            const [size, align, viewIndex] = WEBGPU_SCHEMA_UNITS[schema]
            const index = +String(prop)
            if (isNaN(index) || index < 0 || index >= size) return false
            pad(align)
            target.set(viewIndex, offset + index, value)
            return true
          }
          return false
        },
      })
    }
    this.value = createPathProxy(schema) as unknown as SchemaToValue<S>
  }
}
