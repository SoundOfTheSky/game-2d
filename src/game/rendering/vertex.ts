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

/** Currently doesn't support formats below 4 bytes */
export class WebGPUVertex<
  Attributes extends Record<string, WebGPUSchemaUnitsKeys>,
> extends WebGPUBuffer {
  public readonly idToIndex = new Map<number, number>()
  public readonly indexToId: number[] = []
  public readonly instanceSize

  protected readonly vertexAttributes

  public constructor(
    public readonly attributes: Attributes,
    public readonly maxInstances: number,
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

  public getLayout(
    offsetLocation: number,
    instanced = false,
  ): GPUVertexBufferLayout {
    return {
      arrayStride: this.instanceSize * 4,
      attributes: this.vertexAttributes.map(([offset, format], index) => ({
        format: format,
        offset: offset,
        shaderLocation: offsetLocation + index,
      })),
      stepMode: instanced ? 'instance' : 'vertex',
    }
  }
}
