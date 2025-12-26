import { Tuple } from '@softsky/utils'

import { device } from './webgpu'

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

export enum WebGPUBufferView {
  FLOAT = 0,
  INT = 1,
  UNT = 2,
}
type WebGPUSchemaUnits = typeof WEBGPU_SCHEMA_UNITS
type WebGPUSchemaUnitsKeys = keyof WebGPUSchemaUnits
type WebGPUSchemaData =
  | WebGPUSchema<any>
  | WebGPUSchemaArray<any, any>
  | WebGPUSchemaUnitsKeys
type SchemaToValue<S extends WebGPUSchemaData> =
  S extends WebGPUSchemaArray<infer Schema, any> // If array
    ? SchemaToValue<Schema>[]
    : S extends WebGPUSchema<infer Schema> // If object
      ? { -readonly [K in keyof Schema]: SchemaToValue<Schema[K]> }
      : S extends WebGPUSchemaUnitsKeys // If value
        ? WebGPUSchemaUnits[S] extends readonly [
            infer Len extends number,
            any,
            any,
          ]
          ? Tuple<number, Len>
          : never
        : never

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

export class WebGPUSchemaArray<
  const S extends WebGPUSchema<any> | WebGPUSchemaUnitsKeys,
  L extends number,
> {
  public readonly elementSize
  /** Includes after alignment */
  public readonly size
  /** Pad offset by this number before use */
  public readonly align

  public constructor(
    public readonly schema: S,
    public readonly length: L,
  ) {
    if (typeof this.schema === 'string') {
      const [size, align] =
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        WEBGPU_SCHEMA_UNITS[this.schema as WebGPUSchemaUnitsKeys]
      // Can't be more than 4. Only for vec3 case
      this.elementSize = align === 4 ? 4 : size
      this.align = align
    } else {
      this.elementSize = this.schema.size
      this.align = this.schema.align
    }
    this.size = this.elementSize * this.length
  }
}

export class WebGPUSchema<const S extends Record<string, WebGPUSchemaData>> {
  /** Offset of each field */
  public offsets = new Map<string, number>()
  /** Pad offset by this number before use */
  public align = 1
  /** Includes after alignment */
  public size

  public constructor(public schema: S) {
    let offset = 0
    const pad = (align: number) =>
      (offset += (align - (offset % align)) % align)
    for (const key in schema) {
      const value = schema[key]!
      if (typeof value === 'string') {
        const [size, align] =
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          WEBGPU_SCHEMA_UNITS[value as WebGPUSchemaUnitsKeys]
        pad(align)
        this.offsets.set(key, offset)
        offset += size
        if (align > this.align) this.align = align
      } else {
        pad(value.align)
        this.offsets.set(key, offset)
        offset += value.size
        pad(value.align)
        if (value.align > this.align) this.align = value.align
      }
    }
    pad(this.align)
    this.size = offset
  }
}

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
  protected readonly value: SchemaToValue<S>

  public constructor(
    public schema: S,
    usage: GPUBufferUsageFlags,
  ) {
    super(
      typeof schema === 'string'
        ? // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          WEBGPU_SCHEMA_UNITS[schema as WebGPUSchemaUnitsKeys][1]
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
            return target.dataViews[viewIndex]![offset + index]
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

// type DataForAttributes<
//   Attributes extends Record<string, keyof typeof VERTEX_UNITS>,
// > = {
//   [K in keyof Attributes]: number[] & {
//     length: (typeof VERTEX_UNITS)[Attributes[K]]
//   }
// }

// const VERTEX_UNITS = {
//   float32: 1,
//   float32x2: 2,
//   float32x3: 3,
//   float32x4: 4,
//   uint32: 1,
//   uint32x2: 2,
//   uint32x3: 3,
//   uint32x4: 4,
//   sint32: 1,
//   sint32x2: 2,
//   sint32x3: 3,
//   sint32x4: 4,
// } as const
// /** Currently doesn't support formats below 4 bytes */
// export class WebGPUBufferInstances<
//   Attributes extends Record<string, keyof typeof VERTEX_UNITS>,
// > extends WebGPUBuffer {
//   public readonly idToIndex = new Map<number, number>()
//   public readonly indexToId: number[] = []
//   public readonly instanceSize

//   protected readonly vertexAttributes
//   protected uploadStart = Infinity
//   protected uploadEnd = 0

//   public constructor(
//     public readonly attributes: Attributes,
//     public readonly maxInstances = 256,
//   ) {
//     const vertexAttributes: [number, GPUVertexFormat][] = []
//     let offset = 0
//     for (const key in attributes) {
//       const format = attributes[key]!
//       vertexAttributes.push([offset, format])
//       offset += VERTEX_UNITS[format] * 4
//     }
//     const instanceSize = offset / 4
//     super(
//       instanceSize * maxInstances,
//       GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
//     )
//     this.instanceSize = instanceSize
//     this.vertexAttributes = vertexAttributes
//   }

//   public add(id: number, instance: DataForAttributes<Attributes>) {
//     if (this.indexToId.length === this.maxInstances)
//       throw new Error('Max instances reached')
//     if (this.idToIndex.has(id))
//       throw new Error(`Instance "${id}" already exists`)
//     let cursor = this.indexToId.length * this.instanceSize
//     for (const name in this.attributes) {
//       const values = instance[name]
//       this.data.set(values, cursor)
//       cursor += values.length
//     }
//     this.uploadEnd = cursor
//     // Update id mapping
//     this.idToIndex.set(id, this.indexToId.length)
//     this.indexToId[this.indexToId.length] = id
//   }

//   public update(id: number, instance: Partial<DataForAttributes<Attributes>>) {
//     const index = this.idToIndex.get(id)
//     if (index === undefined) return
//     const offset = index * this.instanceSize
//     let cursor = offset
//     for (const name in this.attributes) {
//       const values = instance[name]
//       if (values) {
//         const end = values.length + cursor
//         if (cursor < this.uploadStart) this.uploadStart = cursor
//         if (end > this.uploadEnd) this.uploadEnd = end
//         this.data.set(values, cursor)
//       }
//       cursor += VERTEX_UNITS[this.attributes[name]!] * 4
//     }
//   }

//   public remove(id: number) {
//     const index = this.idToIndex.get(id)
//     if (index === undefined) return
//     this.idToIndex.delete(id)
//     const lastId = this.indexToId.pop()!
//     if (index === this.indexToId.length) return
//     // Copy last instance into the removed slot
//     const offset = index * this.instanceSize
//     const lastOffset = this.indexToId.length * this.instanceSize
//     const updatedInstance = this.data.subarray(
//       lastOffset,
//       lastOffset + this.instanceSize,
//     )
//     this.data.set(updatedInstance, offset)
//     const end = offset + this.instanceSize
//     if (offset < this.uploadStart) this.uploadStart = offset
//     if (end > this.uploadEnd) this.uploadEnd = end
//     // Update id/index mapping
//     this.idToIndex.set(lastId, index)
//     this.indexToId[index] = lastId
//   }

//   public upload() {
//     if (this.uploadEnd <= this.uploadStart) return
//     device.queue.writeBuffer(
//       this.buffer,
//       this.uploadStart * 4,
//       this.data,
//       this.uploadStart,
//       this.uploadEnd - this.uploadStart,
//     )
//     this.uploadStart = Infinity
//     this.uploadEnd = 0
//   }

//   public getLayout(
//     offsetLocation: number,
//     instanced = false,
//   ): GPUVertexBufferLayout {
//     return {
//       arrayStride: this.instanceSize * 4,
//       attributes: this.vertexAttributes.map((x) => ({
//         format: x.format,
//         offset: x.offset,
//         shaderLocation: offsetLocation + x.shaderLocation,
//       })),
//       stepMode: instanced ? 'instance' : 'vertex',
//     }
//   }

//   public destroy() {
//     this.buffer.destroy()
//   }
// }
