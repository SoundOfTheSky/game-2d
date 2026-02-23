/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { LastValueInObject } from '@softsky/utils'

import { WebGPUBuffer } from './buffer'
import {
  WEBGPU_SCHEMA_UNITS,
  WebGPUSchema,
  WebGPUSchemaArray,
  WebGPUSchemaData,
  WebGPUSchemaUnits,
  WebGPUSchemaUnitsKeys,
} from './schema'

export type SchemaToValue<S extends WebGPUSchemaData> =
  S extends WebGPUSchemaArray<infer Schema, any> // If array
    ? readonly SchemaToValue<Schema>[]
    : S extends WebGPUSchema<infer Schema> // If object
      ? { readonly [K in keyof Schema]: SchemaToValue<Schema[K]> }
      : S extends WebGPUSchemaUnitsKeys // If value
        ? WebGPUSchemaUnits[S] extends readonly [any, any, any, any?]
          ? number[] | Float32Array | Uint32Array | Int32Array
          : never
        : never

export type LastArraySchema<S> =
  S extends WebGPUSchemaArray<any, any>
    ? S
    : S extends WebGPUSchema<infer O>
      ? LastArraySchema<LastValueInObject<O>>
      : never

export type LastArrayInSchema<S extends WebGPUSchemaData> =
  LastArraySchema<S> extends WebGPUSchemaArray<infer Schema, any>
    ? SchemaToValue<Schema>
    : never

function recursiveSet<T extends object, K extends keyof T>(
  obj: T,
  key: K,
  value: T[K],
) {
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value))
      for (let i = 0; i < value.length; i++)
        recursiveSet(obj[key] as any, i as any, value[i]!)
    else
      for (const subKey in value)
        recursiveSet(obj[key] as any, subKey as any, value[subKey]!)
  } else obj[key] = value
}

/**
 * Allow to create webgpu aligned memory.
 * When working with data please only use direct assingment.
 *
 * Please be aware that data is stored contiguously in memory according to the schema,
 * and changing values in different parts will lead to re-upload of everything in between.
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
      const proxy = new Proxy(this, {
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
          } else recursiveSet(proxy, prop as any, value)
          return true
        },
      })
      return proxy
    }
    this.value = createPathProxy(schema) as unknown as SchemaToValue<S>
  }

  public getPathInfo(path: string[]) {
    let schema: WebGPUSchemaData | undefined = this.schema
    let offset = 0
    const pad = (align: number) => {
      offset += (align - (offset % align)) % align
    }
    for (let index = 0; index < path.length; index++) {
      const property = path[index]!
      if (!schema) return undefined
      else if (typeof schema === 'string') {
        const [unitSize, align] = WEBGPU_SCHEMA_UNITS[schema]!
        const index = +property
        if (isNaN(index) || index < 0 || index >= unitSize) return undefined
        pad(align)
        schema = undefined
      } else if (schema instanceof WebGPUSchemaArray) {
        const index = +property
        if (isNaN(index) || index < 0 || index >= schema.length)
          return undefined
        pad(schema.align)
        offset += index * schema.elementSize
        schema = schema.schema
      } else {
        const fieldOffset = schema.offsets.get(property)
        if (fieldOffset === undefined) return undefined
        pad(schema.align)
        offset += fieldOffset
        schema = schema.schema[property]
      }
    }
    return {
      offset,
      size:
        typeof schema === 'string'
          ? WEBGPU_SCHEMA_UNITS[schema]![0]
          : (schema?.size ?? 1),
    }
  }
}

/**
 * Extends WebGPUMemory with added functionality for runtime size arrays.
 * The last element in the schema must be an array.
 *
 * Be aware that removing instances will swap the last instance into the removed spot.
 * This way the order of instances is not guaranteed to be preserved.
 *
 * @example
 * const memory = new WebGPUMemoryLastArray(new WebGPUSchema({
 *   transform: new WebGPUSchema({
 *     position: 'vec3f',
 *     rotation: 'vec4f',
 *   }),
 *   size: 'i32',
 *   instances: new WebGPUSchemaArray(new WebGPUSchema({
 *     offset: 'vec3f',
 *     scale: 'vec3f',
 *   }), 4096), // Max 4096 instances
 * }), GPUBufferUsage.STORAGE, (size) => {
 *   // Recommended to use different memories to store other data and instances
 *   // because otherwise we would need to reupload all instances on other data change
 *   memory.value.size[0] = size
 * })
 */
export class WebGPUMemoryLastArray<
  const S extends WebGPUSchemaData,
> extends WebGPUMemory<S> {
  public readonly arraySchema: WebGPUSchemaArray<any, any>
  public readonly array: LastArrayInSchema<S>[]
  public readonly idToIndex = new Map<number, number>()
  public readonly indexToId: number[] = []

  public constructor(
    schema: S,
    usage: GPUBufferUsageFlags,
    public setSize: (size: number) => unknown,
  ) {
    super(schema, usage)
    // Find last array schema and array reference
    this.arraySchema = schema as any
    while ((!this.arraySchema as any) instanceof WebGPUSchemaArray)
      this.arraySchema = Object.values(this.arraySchema) as any
    this.array = this.value as any
    while (!Array.isArray(this.array))
      this.array = Object.values(this.array) as any
  }

  public add(id: number, instance: LastArrayInSchema<S>) {
    if (this.indexToId.length === this.array.length)
      throw new Error('Max instances reached')
    if (this.idToIndex.has(id))
      throw new Error(`Instance "${id}" already exists`)
    // Should update upload range correctly
    this.array[this.indexToId.length] = instance
    // Update id mapping
    this.idToIndex.set(id, this.indexToId.length)
    this.indexToId[this.indexToId.length] = id
    this.setSize(this.indexToId.length)
  }

  public update(id: number, instance: LastArrayInSchema<S>) {
    const index = this.idToIndex.get(id)
    if (index === undefined) throw new Error(`Instance "${id}" doesn't exist`)
    recursiveSet(this.array, index, instance)
  }

  public remove(id: number) {
    const index = this.idToIndex.get(id)
    if (index === undefined) return
    this.idToIndex.delete(id)
    const lastId = this.indexToId.pop()!
    if (index === this.indexToId.length) return
    this.array[index] = this.array[this.indexToId.length - 1]!
    // Uzdate id/index mapping
    this.idToIndex.set(lastId, index)
    this.indexToId[index] = lastId
    this.setSize(this.indexToId.length)
  }

  public get(id: number): LastArrayInSchema<S> | undefined {
    const index = this.idToIndex.get(id)
    if (index === undefined) return undefined
    return this.array[index]
  }
}
