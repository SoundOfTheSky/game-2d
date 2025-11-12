export const canvas = document.querySelector('canvas')!
const context = canvas.getContext('webgpu')
if (!context) throw new Error('WebGPU is not supported')
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
const adapter = await navigator.gpu?.requestAdapter({
  powerPreference: 'low-power',
})
if (!adapter) throw new Error('WebGPU is not supported')
const presentationFormat = navigator.gpu.getPreferredCanvasFormat()
const device = await adapter.requestDevice()
context.configure({
  device,
  format: presentationFormat,
  alphaMode: 'premultiplied',
})

// === Resize ===
function setCanvasSize() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}
setCanvasSize()
window.addEventListener('resize', setCanvasSize)

// === Texture ===
export class Texture {
  public texture

  public constructor(source: HTMLImageElement) {
    this.texture = device.createTexture({
      size: [source.naturalWidth, source.naturalHeight],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    })
    this.update(source)
  }

  public update(source: HTMLImageElement) {
    device.queue.copyExternalImageToTexture(
      { source },
      { texture: this.texture },
      [source.width, source.height],
    )
  }
}

// === Vertex ===
const VERTEX_FORMAT_32 = {
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
type DataForAttributes<
  Attributes extends Record<string, keyof typeof VERTEX_FORMAT_32>,
> = {
  [K in keyof Attributes]: number[] & {
    length: (typeof VERTEX_FORMAT_32)[Attributes[K]]
  }
}

/** Currently doesn't support formats below 4 bytes */
export class Vertex<
  Attributes extends Record<string, keyof typeof VERTEX_FORMAT_32>,
> {
  public readonly buffer
  public readonly idToIndex = new Map<number, number>()
  public readonly indexToId: number[] = []
  public readonly data
  public readonly instanceSize

  protected readonly vertexAttributes: GPUVertexAttribute[] = []

  public constructor(
    public readonly attributes: Attributes,
    public readonly maxInstances = 256,
  ) {
    let shaderLocation = 0
    let offset = 0
    for (const key in attributes) {
      const format = attributes[key]!
      this.vertexAttributes.push({ shaderLocation, offset, format })
      shaderLocation++
      offset += VERTEX_FORMAT_32[format] * 4
    }
    this.instanceSize = offset / 4
    this.data = new Float32Array(this.instanceSize * maxInstances)
    this.buffer = device.createBuffer({
      size: this.data.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    })
  }

  public add(
    id: number,
    instance: DataForAttributes<Attributes>,
    skipUpload = false,
  ) {
    if (this.indexToId.length === this.maxInstances)
      throw new Error('Max instances reached')
    if (this.idToIndex.has(id))
      throw new Error(`Instance "${id}" already exists`)

    const offset = this.indexToId.length * this.instanceSize
    let cursor = offset
    for (const name in this.attributes) {
      const values = instance[name]
      this.data.set(values, cursor)
      cursor += values.length
    }
    if (!skipUpload)
      device.queue.writeBuffer(
        this.buffer,
        offset * 4,
        this.data.subarray(offset, offset + this.instanceSize),
      )
    // Update id mapping
    this.idToIndex.set(id, this.indexToId.length)
    this.indexToId[this.indexToId.length] = id
  }

  public update(
    id: number,
    instance: Partial<DataForAttributes<Attributes>>,
    skipUpload = false,
  ) {
    const index = this.idToIndex.get(id)
    if (index === undefined) return
    const offset = index * this.instanceSize
    let cursor = offset
    for (const name in this.attributes) {
      const values = instance[name]
      if (values) this.data.set(values, cursor)
      cursor += VERTEX_FORMAT_32[this.attributes[name]!] * 4
    }
    if (!skipUpload)
      device.queue.writeBuffer(
        this.buffer,
        offset * 4,
        this.data.subarray(offset, offset + this.instanceSize),
      )
  }

  public remove(id: number, skipUpload = false) {
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
    if (!skipUpload)
      device.queue.writeBuffer(this.buffer, index * 4, updatedInstance)
    // Updare id/index mapping
    this.idToIndex.set(lastId, index)
    this.indexToId[index] = lastId
  }

  public upload() {
    device.queue.writeBuffer(
      this.buffer,
      0,
      this.data.subarray(0, this.indexToId.length * this.instanceSize),
    )
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
