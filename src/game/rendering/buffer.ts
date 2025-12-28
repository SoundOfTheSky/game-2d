import { device } from './webgpu'

export enum WebGPUBufferDataType {
  FLOAT = 'floatData',
  INT = 'intData',
  UINT = 'uintData',
}

/** Currently doesn't support formats below 4 bytes */
export class WebGPUBuffer {
  public readonly buffer

  public readonly floatData
  public readonly uintData
  public readonly intData

  protected uploadStart = Infinity
  protected uploadEnd = 0

  public constructor(
    size: number,
    usage: GPUBufferUsageFlags,
    public readonly data = new ArrayBuffer(size * 4),
    public readonly offset = 0,
  ) {
    const byteOffset = offset * 4
    this.floatData = new Float32Array(this.data, byteOffset, size)
    this.uintData = new Uint32Array(this.data, byteOffset, size)
    this.intData = new Int32Array(this.data, byteOffset, size)
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

  /** Recommended to use this instad */
  public set(
    view: WebGPUBufferDataType,
    dataIndex: number,
    value: number | number[],
  ) {
    if (dataIndex < this.uploadStart) this.uploadStart = dataIndex
    if (typeof value === 'number') {
      if (dataIndex >= this.uploadEnd) this.uploadEnd = dataIndex + 1
      this[view][dataIndex] = value
    } else {
      const endIndex = dataIndex + value.length
      if (endIndex > this.uploadEnd) this.uploadEnd = endIndex
      const target = this[view]
      for (let i = 0; i < value.length; i++) target[dataIndex + i] = value[i]!
    }
  }

  public destroy() {
    this.buffer.destroy()
  }
}
