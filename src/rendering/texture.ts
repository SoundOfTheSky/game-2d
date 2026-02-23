import { device, presentationFormat } from './webgpu'

export const pixelSampler = device.createSampler({
  magFilter: 'nearest',
  minFilter: 'nearest',
})

export type WebGPUTexture =
  | WebGPUTextureCanvas
  | WebGPUTextureEmpty
  | WebGPUTextureImage
  | WebGPUTextureVideo

export class WebGPUTextureVideo {
  public texture!: GPUExternalTexture

  public constructor(public source: HTMLVideoElement | VideoFrame) {
    this.update()
  }

  public update() {
    this.texture = device.importExternalTexture({
      source: this.source,
    })
  }

  public destroy() {}
}

export class WebGPUTextureEmpty {
  public texture!: GPUTexture

  public constructor(
    public width: number,
    public height: number,
    public usage = GPUTextureUsage.COPY_DST |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.COPY_SRC,
  ) {
    this.update()
  }

  public update() {
    this.destroy()
    this.texture = device.createTexture({
      size: [this.width, this.height],
      format: presentationFormat,
      usage: this.usage,
    })
  }

  public destroy() {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    this.texture?.destroy()
  }
}

export class WebGPUTextureCanvas {
  public texture!: GPUTexture
  public context: GPUCanvasContext

  public constructor(source: HTMLCanvasElement) {
    this.context = source.getContext('webgpu')!
    this.context.configure({
      device,
      format: presentationFormat,
      alphaMode: 'premultiplied',
    })
    this.update()
  }

  public update() {
    this.texture = this.context.getCurrentTexture()
  }

  public destroy() {
    this.texture.destroy()
  }
}

export class WebGPUTextureImage {
  public texture: GPUTexture

  public constructor(
    public source: ImageBitmap | ImageData | HTMLImageElement,
    public readonly sampler = pixelSampler,
    usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  ) {
    this.texture = device.createTexture({
      size: [source.width, source.height],
      format: presentationFormat,
      usage,
    })
    this.update()
  }

  public update() {
    device.queue.copyExternalImageToTexture(
      { source: this.source, flipY: true },
      { texture: this.texture },
      [this.source.width, this.source.height],
    )
  }

  public destroy() {
    this.texture.destroy()
  }
}
