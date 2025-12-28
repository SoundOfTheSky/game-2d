import { WebGPUBufferDataType } from './buffer'

/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
export const WEBGPU_SCHEMA_UNITS = {
  i32: [1, 1, WebGPUBufferDataType.INT, 'sint32'],
  u32: [1, 1, WebGPUBufferDataType.UINT, 'uint32'],
  f32: [1, 1, WebGPUBufferDataType.FLOAT, 'float32'],
  vec2i: [2, 2, WebGPUBufferDataType.INT, 'sint32x2'],
  vec2u: [2, 2, WebGPUBufferDataType.UINT, 'uint32x2'],
  vec2f: [2, 2, WebGPUBufferDataType.FLOAT, 'float32x2'],
  vec3i: [3, 4, WebGPUBufferDataType.INT, 'sint32x3'],
  vec3u: [3, 4, WebGPUBufferDataType.UINT, 'uint32x3'],
  vec3f: [3, 4, WebGPUBufferDataType.FLOAT, 'float32x3'],
  vec4i: [4, 4, WebGPUBufferDataType.INT, 'sint32x4'],
  vec4u: [4, 4, WebGPUBufferDataType.UINT, 'uint32x4'],
  vec4f: [4, 4, WebGPUBufferDataType.FLOAT, 'float32x4'],
  mat2x2f: [4, 2, WebGPUBufferDataType.FLOAT],
  mat3x2f: [6, 2, WebGPUBufferDataType.FLOAT],
  mat4x2f: [8, 2, WebGPUBufferDataType.FLOAT],
  mat2x3f: [8, 4, WebGPUBufferDataType.FLOAT],
  mat3x3f: [12, 4, WebGPUBufferDataType.FLOAT],
  mat4x3f: [16, 4, WebGPUBufferDataType.FLOAT],
  mat2x4f: [8, 4, WebGPUBufferDataType.FLOAT],
  mat3x4f: [12, 4, WebGPUBufferDataType.FLOAT],
  mat4x4f: [16, 4, WebGPUBufferDataType.FLOAT],
} as const
export type WebGPUSchemaUnits = typeof WEBGPU_SCHEMA_UNITS
export type WebGPUSchemaUnitsKeys = keyof WebGPUSchemaUnits
export type WebGPUSchemaData =
  | WebGPUSchema<any>
  | WebGPUSchemaArray<any, any>
  | WebGPUSchemaUnitsKeys
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
