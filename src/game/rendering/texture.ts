import { device } from './webgpu'

export class Texture {
  public texture
  public sampler

  public constructor(source: HTMLImageElement) {
    this.texture = device.createTexture({
      size: [source.naturalWidth, source.naturalHeight],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    })
    this.sampler = device.createSampler({
      magFilter: 'nearest',
      minFilter: 'nearest',
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
