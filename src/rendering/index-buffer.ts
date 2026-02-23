import { WebGPUBuffer, WebGPUBufferDataType } from './buffer'

export class WebGPUIndexBuffer extends WebGPUBuffer {
  public indexCount = 0

  public constructor(maxIndices: number) {
    super(maxIndices, GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST)
  }

  public setIndices(indices: number[]) {
    this.indexCount = indices.length
    this.set(WebGPUBufferDataType.UINT, 0, indices)
  }
}
