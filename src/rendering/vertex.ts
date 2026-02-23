import { WebGPUBuffer } from './buffer'
import {
  WEBGPU_SCHEMA_UNITS,
  WebGPUSchemaUnits,
  WebGPUSchemaUnitsKeys,
} from './schema'

type DataForAttributes<
  Attributes extends Record<string, WebGPUSchemaUnitsKeys>,
> = {
  [K in keyof Attributes]: number[] & {
    length: WebGPUSchemaUnits[Attributes[K]][0]
  }
}

/**
 * Create WebGPU vertex buffer with given attributes.
 *
 * Please be aware that data is stored contiguously in memory according to the schema,
 * and changing values in different parts will lead to re-upload of everything in between.
 *
 * @example
 * const vertexBuffer = new WebGPUVertex({
 *   position: 'vec3',
 *   color: 'vec4',
 * }, 1000) // Max 1000 instances
 * vertexBuffer.add(1, {
 *   position: [0, 0, 0],
 *   color: [1, 0, 0, 1],
 * })
 * vertexBuffer.update(1, {
 *   position: [1, 1, 1],
 * })
 * vertexBuffer.remove(1)
 * vertexBuffer.upload() // Upload changed data to GPU
 */
export class WebGPUVertex<
  Attributes extends Record<string, WebGPUSchemaUnitsKeys>,
> extends WebGPUBuffer {
  public readonly idToIndex = new Map<number, number>()
  public readonly indexToId: number[] = []
  public readonly instanceSize

  protected readonly vertexAttributes

  public constructor(
    public readonly attributes: Attributes,
    public instanceMode = false,
    public readonly maxInstances = 1,
  ) {
    const vertexAttributes: [number, GPUVertexFormat][] = []
    let offset = 0
    for (const key in attributes) {
      const [size, _a, _b, format] = WEBGPU_SCHEMA_UNITS[attributes[key]!]
      if (!format)
        throw new Error(`Unsupported vertex format for attribute "${key}"`)
      vertexAttributes.push([offset, format])
      offset += size * 4
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
      this.set(WEBGPU_SCHEMA_UNITS[this.attributes[name]!][2], cursor, values)
      cursor += values.length
    }
    this.uploadEnd = cursor
    // Update id mapping
    this.idToIndex.set(id, this.indexToId.length)
    this.indexToId[this.indexToId.length] = id
  }

  public update(id: number, instance: Partial<DataForAttributes<Attributes>>) {
    const index = this.idToIndex.get(id)
    if (index === undefined) throw new Error(`Instance "${id}" doesn't exist`)
    let cursor = index * this.instanceSize
    for (const name in this.attributes) {
      const values = instance[name]
      const [size, , view] = WEBGPU_SCHEMA_UNITS[this.attributes[name]!]
      if (values) {
        const end = values.length + cursor
        if (cursor < this.uploadStart) this.uploadStart = cursor
        if (end > this.uploadEnd) this.uploadEnd = end
        this.set(view, cursor, values)
      }
      cursor += size
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
    // Doesn't matter what type of data we use
    const updatedInstance = this.intData.subarray(
      lastOffset,
      lastOffset + this.instanceSize,
    )
    this.intData.set(updatedInstance, offset)
    const end = offset + this.instanceSize
    if (offset < this.uploadStart) this.uploadStart = offset
    if (end > this.uploadEnd) this.uploadEnd = end
    // Update id/index mapping
    this.idToIndex.set(lastId, index)
    this.indexToId[index] = lastId
  }

  public getLayout(offsetLocation = 0) {
    return {
      arrayStride: this.instanceSize * 4,
      attributes: this.vertexAttributes.map(([offset, format], index) => ({
        format: format,
        offset: offset,
        shaderLocation: offsetLocation + index,
      })),
      stepMode: this.instanceMode ? ('instance' as const) : ('vertex' as const),
    }
  }
}
