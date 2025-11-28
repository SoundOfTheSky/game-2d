/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Tuple } from '@softsky/utils'

import { device } from './webgpu'

type PathNode = { key: string; prev?: PathNode }

type DataForAttributes<
  Attributes extends Record<string, keyof typeof VERTEX_UNITS>,
> = {
  [K in keyof Attributes]: number[] & {
    length: (typeof VERTEX_UNITS)[Attributes[K]]
  }
}

const VERTEX_UNITS = {
  float32: 1,
  float32x2: 2,
  float32x3: 3,
  float32x4: 4,
  uint32: 1,
  uint32x2: 2,
  uint32x3: 3,
  uint32x4: 4,
  sint32: 1,
  sint32x2: 2,
  sint32x3: 3,
  sint32x4: 4,
} as const

export enum WebGPUBufferView {
  FLOAT = 0,
  INT = 1,
  UNT = 2,
}

export const WEBGPU_SCHEMA_UNITS = {
  i32: [1, 1, 1],
  u32: [1, 1, 2],
  f32: [1, 1, 0],
  vec2i: [2, 2, 1],
  vec2u: [2, 2, 2],
  vec2f: [2, 2, 0],
  vec3i: [3, 4, 1],
  vec3u: [3, 4, 2],
  vec3f: [3, 4, 0],
  vec4i: [4, 4, 1],
  vec4u: [4, 4, 2],
  vec4f: [4, 4, 0],
  mat2x2f: [4, 2, 0],
  mat3x2f: [6, 2, 0],
  mat4x2f: [8, 2, 0],
  mat2x3f: [8, 4, 0],
  mat3x3f: [12, 4, 0],
  mat4x3f: [16, 4, 0],
  mat2x4f: [8, 4, 0],
  mat3x4f: [12, 4, 0],
  mat4x4f: [16, 4, 0],
} as const

type WebGPUSchemaUnits = typeof WEBGPU_SCHEMA_UNITS

type WebGPUSchemaData =
  | keyof WebGPUSchemaUnits
  | WebGPUSchema
  | Record<string, WebGPUSchema>

type SchemaToValue<S extends WebGPUSchemaData> =
  S extends WebGPUSchema<infer ArraySchema, infer ArraySize>
    ? ArraySize extends number
      ? SchemaToValue<ArraySchema>[]
      : SchemaToValue<ArraySchema>
    : S extends keyof WebGPUSchemaUnits
      ? WebGPUSchemaUnits[S] extends readonly [
          infer Len extends number,
          any,
          any,
        ]
        ? Tuple<number, Len>
        : never
      : never

const PROXY_HANDLER = {
  set(target: any, prop: string | symbol, value: any) {
    for (const key in value)
      (target[prop as any]! as Record<string, any>)[key] = value[key]
    return true
  },
}

/** Currently doesn't support formats below 4 bytes */
export class WebGPUBuffer {
  public readonly buffer

  public readonly dataViews

  protected uploadStart = Infinity
  protected uploadEnd = 0

  public constructor(
    size: number,
    usage: GPUBufferUsageFlags,
    public readonly data = new ArrayBuffer(size * 4),
    public readonly offset = 0,
  ) {
    const byteOffset = offset * 4
    this.dataViews = [
      new Float32Array(this.data, byteOffset, size),
      new Int32Array(this.data, byteOffset, size),
      new Uint32Array(this.data, byteOffset, size),
    ]
    this.buffer = device.createBuffer({
      size: this.data.byteLength,
      usage,
    })
  }

  public upload() {
    if (this.uploadEnd <= this.uploadStart) return
    console.log('webgpubuffer upload', this.uploadStart, this.uploadEnd)
    this.uploadStart *= 4
    this.uploadEnd *= 4
    device.queue.writeBuffer(
      this.buffer,
      this.uploadStart,
      this.data,
      this.uploadStart,
      this.uploadEnd - this.uploadStart,
    )
    this.uploadStart = Infinity
    this.uploadEnd = 0
  }

  public set(view: WebGPUBufferView, dataIndex: number, value: number) {
    if (dataIndex < this.uploadStart) this.uploadStart = dataIndex
    if (dataIndex >= this.uploadEnd) this.uploadEnd = dataIndex + 1
    this.dataViews[view]![dataIndex] = value
    return true
  }

  public destroy() {
    this.buffer.destroy()
  }
}

/**
 * Create WebGPU
 */
export class WebGPUSchema<
  const S extends WebGPUSchemaData = WebGPUSchemaData,
  L extends number | undefined = undefined,
> {
  public offsets = new Map<string, number>()
  public align = 1
  public size = 0

  public constructor(
    public schema: S,
    public length?: L,
  ) {
    if (typeof schema === 'string') {
      const [size, align] =
        WEBGPU_SCHEMA_UNITS[schema as keyof WebGPUSchemaUnits]
      this.align = align
      this.size = size
      return
    }
    // Weird case but let's just copy schema
    if (schema instanceof WebGPUSchema) {
      this.schema = schema.schema as S
      this.offsets = schema.offsets
      this.size = schema.size
      this.length = schema.length
      return
    }

    let offset = 0
    // eslint-disable-next-line @typescript-eslint/no-for-in-array
    for (const key in schema) {
      const value = schema[key] as WebGPUSchema<any, number | undefined>
      if (value.align > this.align) this.align = value.align
      offset += (value.align - (offset % value.align)) % value.align
      this.offsets.set(key, offset)
      offset += value.size * (value.length ?? 1)
    }
    offset += (this.align - (offset % this.align)) % this.align
    this.size = offset
  }
}

/**
 * Allow to create webgpu aligned memory.
 * When working with data please only use direct assingment
 *
 * @example
 * const memory = new WebGPUMemory({
 *   pos: new WebGPUSchemaArray('vec2f', 32),
 * })
 * memory.value.pos = [16,8]
 * memory.upload()
 * memory.value.pos[1] = 16
 * memory.upload()
 */
export class WebGPUMemory<
  const S extends WebGPUSchemaData,
> extends WebGPUBuffer {
  protected readonly offsets
  protected readonly _value: SchemaToValue<S>

  /**
   * It's a virtual object that is bound to specific addresses in Uniform's memory.
   * Setting data with anything but `=` will not work.
   * Equality operators on objects will not work as expected.
   * After updating data you have to call `upload()`
   */
  public get value(): SchemaToValue<S> {
    // @ts-expect-error TS can't follow
    return this._value
  }
  public set value(value: SchemaToValue<S>) {
    for (const key in value)
      (this._value as Record<string, any>)[key] = value[key]
  }

  public constructor(
    public schema: S,
    usage: GPUBufferUsageFlags,
  ) {
    // eslint-disable-next-line prefer-const
    let self: WebGPUMemory<S>
    const offsets = new Map<string, number>()
    let offset = 0

    const pad = (align: number) => {
      offset += (align - (offset % align)) % align
    }

    const getAlign = (schema: WebGPUSchemaData): 1 | 2 | 4 => {
      if (typeof schema === 'string') return WEBGPU_SCHEMA_UNITS[schema][1]
      if (schema instanceof WebGPUSchemaArray) return getAlign(schema.schema)
      let align: 1 | 2 | 4 = 1
      for (const key in schema) {
        const builtAlign = getAlign(schema[key])
        // Possible values are 1,2,4
        if (builtAlign === 4) return 4
        if (builtAlign === 2) align = 2
      }
      return align
    }

    const build = (
      buildSchema: WebGPUSchemaData = schema,
      parent: any = {},
      path = '',
      name: string | number = '',
    ) => {
      const nextPath = path ? `${path}.${name}` : name.toString()
      if (typeof buildSchema === 'string') {
        const [size, align, viewIndex] = WEBGPU_SCHEMA_UNITS[buildSchema]
        // Make sure each data is started from correct alignment
        pad(align)
        offsets.set(nextPath, offset)
        const base = offset
        offset += size
        // Create proxy for uniform
        return (parent[name] = new Proxy(
          {},
          {
            get(_, prop) {
              if (prop === 'length') return size
              if (prop === Symbol.iterator)
                return function* () {
                  for (let i = 0; i < size; i++)
                    yield self.dataViews[viewIndex]![base + i]
                }
              return self.dataViews[viewIndex]![
                (base + +(prop as string)) as any
              ]
            },
            set: (_, prop, value) =>
              self.set(viewIndex, base + +(prop as string), value),
          },
        ))
      }
      if (buildSchema instanceof WebGPUSchemaArray) {
        // Recursively set inner objects
        const align = getAlign(buildSchema.schema)
        pad(align)
        const array: unknown[] = []
        for (let i = 0; i < buildSchema.length; i++)
          build(buildSchema.schema, array, nextPath, i)
        pad(align)
        return (parent[name] = new Proxy(array, PROXY_HANDLER))
      }
      // Recursively set inner objects
      const object: Record<string, unknown> = {}
      const align = getAlign(buildSchema)
      pad(align)
      for (const key in buildSchema)
        build(buildSchema[key], object, nextPath, key)
      pad(align)
      return (parent[name] = new Proxy(object, PROXY_HANDLER))
    }
    const value = build(schema)
    pad(4)
    super(offset, usage)
    this._value = value
    this.offsets = offsets
    self = this

    // const createPathProxy = (buildSchema: WebGPUSchema = schema, path = '') =>
    //   new Proxy(function () {}, {
    //     get(_target, prop) {
    //       if (typeof buildSchema === 'string') {
    //       }
    //       const nextPath = path ? `${path}.${String(prop)}` : String(prop)
    //       return createPathProxy(nextPath)
    //     },
    //   })
  }
}

/** Currently doesn't support formats below 4 bytes */
export class WebGPUBufferInstances<
  Attributes extends Record<string, keyof typeof VERTEX_UNITS>,
> extends WebGPUBuffer {
  public readonly idToIndex = new Map<number, number>()
  public readonly indexToId: number[] = []
  public readonly instanceSize

  protected readonly vertexAttributes
  protected uploadStart = Infinity
  protected uploadEnd = 0

  public constructor(
    public readonly attributes: Attributes,
    public readonly maxInstances = 256,
  ) {
    const vertexAttributes: [number, GPUVertexFormat][] = []
    let offset = 0
    for (const key in attributes) {
      const format = attributes[key]!
      vertexAttributes.push([offset, format])
      offset += VERTEX_UNITS[format] * 4
    }
    const instanceSize = offset / 4
    super(
      instanceSize * maxInstances,
      GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    )
    this.instanceSize = instanceSize
    this.vertexAttributes = vertexAttributes
  }

  public add(id: number, instance: DataForAttributes<Attributes>) {
    if (this.indexToId.length === this.maxInstances)
      throw new Error('Max instances reached')
    if (this.idToIndex.has(id))
      throw new Error(`Instance "${id}" already exists`)
    let cursor = this.indexToId.length * this.instanceSize
    for (const name in this.attributes) {
      const values = instance[name]
      this.data.set(values, cursor)
      cursor += values.length
    }
    this.uploadEnd = cursor
    // Update id mapping
    this.idToIndex.set(id, this.indexToId.length)
    this.indexToId[this.indexToId.length] = id
  }

  public update(id: number, instance: Partial<DataForAttributes<Attributes>>) {
    const index = this.idToIndex.get(id)
    if (index === undefined) return
    const offset = index * this.instanceSize
    let cursor = offset
    for (const name in this.attributes) {
      const values = instance[name]
      if (values) {
        const end = values.length + cursor
        if (cursor < this.uploadStart) this.uploadStart = cursor
        if (end > this.uploadEnd) this.uploadEnd = end
        this.data.set(values, cursor)
      }
      cursor += VERTEX_UNITS[this.attributes[name]!] * 4
    }
  }

  public remove(id: number) {
    const index = this.idToIndex.get(id)
    if (index === undefined) return
    this.idToIndex.delete(id)
    const lastId = this.indexToId.pop()!
    if (index === this.indexToId.length) return
    // Copy last instance into the removed slot
    const offset = index * this.instanceSize
    const lastOffset = this.indexToId.length * this.instanceSize
    const updatedInstance = this.data.subarray(
      lastOffset,
      lastOffset + this.instanceSize,
    )
    this.data.set(updatedInstance, offset)
    const end = offset + this.instanceSize
    if (offset < this.uploadStart) this.uploadStart = offset
    if (end > this.uploadEnd) this.uploadEnd = end
    // Update id/index mapping
    this.idToIndex.set(lastId, index)
    this.indexToId[index] = lastId
  }

  public upload() {
    if (this.uploadEnd <= this.uploadStart) return
    device.queue.writeBuffer(
      this.buffer,
      this.uploadStart * 4,
      this.data,
      this.uploadStart,
      this.uploadEnd - this.uploadStart,
    )
    this.uploadStart = Infinity
    this.uploadEnd = 0
  }

  public getLayout(
    offsetLocation: number,
    instanced = false,
  ): GPUVertexBufferLayout {
    return {
      arrayStride: this.instanceSize * 4,
      attributes: this.vertexAttributes.map((x) => ({
        format: x.format,
        offset: x.offset,
        shaderLocation: offsetLocation + x.shaderLocation,
      })),
      stepMode: instanced ? 'instance' : 'vertex',
    }
  }

  public destroy() {
    this.buffer.destroy()
  }
}
