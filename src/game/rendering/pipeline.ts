import { device, presentationFormat } from './webgpu'

export type PipelineOptions = {
  vertex: {
    module: GPUShaderModule
    buffers?: GPUVertexBufferLayout[] // e.g. vertex.getLayout(...)
  }
  fragment: {
    module: GPUShaderModule
    targets?: GPUColorTargetState[]
  }
  layoutBindGroupLayouts?: GPUBindGroupLayout[] // optional explicit bind group layouts
}

export class Pipeline {
  public pipeline: GPURenderPipeline
  public layout: GPUPipelineLayout

  public descriptor = {
    colorAttachments: [
      {
        view: undefined as any,
        loadOp: 'clear',
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        storeOp: 'store',
      },
    ],
  } satisfies GPURenderPassDescriptor

  public constructor(options: PipelineOptions) {
    const { vertex, fragment, layoutBindGroupLayouts } = options

    this.layout = device.createPipelineLayout({
      bindGroupLayouts: layoutBindGroupLayouts ?? [],
    })

    this.pipeline = device.createRenderPipeline({
      layout: this.layout,
      vertex: {
        module: options.vertex.module,
        entryPoint: 'vertexMain',
        buffers: vertex.buffers ?? [],
      },
      primitive: { topology: 'triangle-list', cullMode: 'none' },
      fragment: {
        module: fragment.module,
        entryPoint: 'fragmentMain',
        targets: fragment.targets ?? [
          {
            format: presentationFormat,
            blend: {
              color: {
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
            },
            writeMask: GPUColorWrite.ALL,
          },
        ],
      },
    })
  }

  /**
   * Begin a render pass and call the provided callback with the encoder.
   *
   * The callback receives GPURenderPassEncoder; you must call draw / setPipeline / setBindGroup etc there.
   */
  public beginPass(
    commandEncoder: GPUCommandEncoder,
    renderTarget: GPUTextureView,
  ) {
    this.descriptor.colorAttachments[0]!.view = renderTarget
    const pass = commandEncoder.beginRenderPass(this.descriptor)
    pass.setPipeline(this.pipeline)
    pass.setBindGroup(0, this.bindGroup)
    pass.setVertexBuffer()
    pass.draw(6, 1, 0, 0)
    pass.end()
    return pass
  }
}
