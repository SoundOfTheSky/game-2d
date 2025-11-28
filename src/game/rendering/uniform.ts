import { Tuple } from '@softsky/utils'

import { device } from './webgpu'

export const UNIFORM_UNITS = {
  atomic: [1, 1],
  vec2: [2, 2],
  vec3: [3, 4],
  vec4: [4, 4],
  mat2x2: [4, 2],
  mat3x2: [6, 2],
  mat4x2: [8, 2],
  mat2x4: [8, 4],
  mat3x4: [12, 4],
  mat4x4: [16, 4],
} as const

type Units = typeof UNIFORM_UNITS

type UniformSchema =
  | keyof Units
  | {
      [key: string]: UniformSchema
    }
  | UniformArray

export class UniformArray<
  const S extends UniformSchema = any,
  L extends number = number,
> {
  public constructor(
    public schema: S,
    public length: L,
  ) {}
}

type SchemaToValue<S extends UniformSchema> =
  S extends UniformArray<infer ArraySchema, infer ArraySize>
    ? Tuple<SchemaToValue<ArraySchema>, ArraySize>
    : S extends keyof Units
      ? Units[S] extends readonly [infer Len extends number, any]
        ? Tuple<number, Len>
        : never
      : S extends Record<string, any>
        ? { -readonly [K in keyof S]: SchemaToValue<S[K]> }
        : never

const PROXY_HANDLER = {
  set(target: any, prop: string | symbol, value: any) {
    for (const key in value)
      (target[prop as any]! as Record<string, any>)[key] = value[key]
    return true
  },
}

export class Uniform<const S extends UniformSchema> {
  public readonly buffer: GPUBuffer
  public readonly bindGroupLayout: GPUBindGroupLayout
  public readonly bindGroup: GPUBindGroup
  public readonly data: Float32Array<ArrayBuffer>
  public readonly offsets = new Map<string, number>()

  protected uploadStart = 0
  protected uploadEnd = 0

  // public API value proxy
  private _value: SchemaToValue<S>
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
    binding: number,
  ) {
    const self = this
    let offset = 0

    const pad = (align: number) => {
      offset += (align - (offset % align)) % align
    }

    const getAlign = (schema: UniformSchema): number => {
      if (typeof schema === 'string') return UNIFORM_UNITS[schema][1]
      if (schema instanceof UniformArray) return getAlign(schema.schema)
      // Object
      let align = 1
      for (const key in schema) {
        const builtAlign = getAlign(schema[key]!)
        if (builtAlign > align) align = builtAlign
      }
      return align
    }

    const build = (
      schema: UniformSchema = this.schema,
      parent: any = {},
      path = '',
      name: string | number = '',
    ) => {
      const nextPath = path ? `${path}.${name}` : name.toString()
      if (typeof schema === 'string') {
        const [size, align] = UNIFORM_UNITS[schema]
        // Make sure each data is started from correct alignment
        pad(align)
        this.offsets.set(nextPath, offset)
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
                  for (let i = 0; i < size; i++) yield self.data[base + i]
                }
              return self.data[(base + (prop as string)) as any]
            },
            set: (_, prop, value) =>
              self.setFloatAt(base + +(prop as string), value),
          },
        ))
      }
      if (schema instanceof UniformArray) {
        // Recursively set inner objects
        const array: unknown[] = []
        const align = getAlign(schema.schema)
        pad(align)
        for (let i = 0; i < schema.length; i++)
          build(schema.schema, array, nextPath, i)
        pad(align)
        return (parent[name] = new Proxy(array, PROXY_HANDLER))
      }
      // Recursively set inner objects
      const object: Record<string, unknown> = {}
      const align = getAlign(schema)
      pad(align)
      for (const key in schema) build(schema[key], object, nextPath, key)
      pad(align)
      return (parent[name] = new Proxy(object, PROXY_HANDLER))
    }
    this._value = build(schema) as typeof this._value
    pad(4)
    // Allocate Float32Array (offset counts floats)
    this.data = new Float32Array(offset).fill(0)
    this.buffer = device.createBuffer({
      size: this.data.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
    this.bindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
      ],
    })
    this.bindGroup = device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {
          binding,
          resource: { buffer: this.buffer },
        },
      ],
    })
    this.uploadEnd = offset
    this.upload()
  }

  public upload() {
    if (this.uploadEnd <= this.uploadStart) return
    console.log(this.uploadStart, this.uploadEnd)
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

  /* Set a float value by absolute float offset */
  protected setFloatAt(offset: number, value: number) {
    this.data[offset] = value
    if (offset < this.uploadStart) this.uploadStart = offset
    if (offset >= this.uploadEnd) this.uploadEnd = offset + 1
    return true
  }
}

export default Uniform
