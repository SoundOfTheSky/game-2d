import { WebGPUVertex } from './vertex'
import { device, presentationFormat } from './webgpu'

export class Pipeline<V extends WebGPUVertex<any>[] | undefined> {
  public pipeline: GPURenderPipeline
  public vertexCount: number | (() => number) = 6
  public instanceCount: number | (() => number) = 1

  public bindGroups?: GPUBindGroup[]
  public vertex?: V

  public constructor(
    shaderCode: string,
    options: {
      vertex?: V
      targets?: GPUColorTargetState[]
      transparent?: boolean
    } = {},
  ) {
    this.setVertex(options.vertex as V)

    const module = device.createShaderModule({ code: shaderCode })
    this.pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module,
        entryPoint: 'vs',
        // Generate layout for vertex
        buffers:
          options.vertex?.map((x, _, arr) =>
            x.getLayout(arr.at(-1)?.attributes.at(-1)?.shaderLocation),
          ) ?? [],
      },
      primitive: { topology: 'triangle-list', cullMode: 'none' },
      fragment: {
        module,
        entryPoint: 'fs',
        targets: options.targets ?? [
          {
            format: presentationFormat,
            blend: options.transparent
              ? {
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
                }
              : undefined,
            writeMask: GPUColorWrite.ALL,
          },
        ],
      },
    })
  }

  public setBindGroups(bindGroups?: GPUBindingResource[][]) {
    this.bindGroups = bindGroups?.map((x, index) =>
      device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(index),
        entries: x.map((resource, binding) => ({
          binding,
          resource,
        })),
      }),
    )
  }

  public setVertex(vertex: V) {
    this.vertex = vertex
    if (!vertex) return
    for (let index = 0; index < vertex.length; index++) {
      const vertexBuffer = vertex[index]!
      if (vertexBuffer.instanceMode)
        this.instanceCount = () => vertexBuffer.indexToId.length
      else this.vertexCount = () => vertexBuffer.indexToId.length
    }
  }

  public render(pass: GPURenderPassEncoder) {
    pass.setPipeline(this.pipeline)
    if (this.bindGroups)
      for (let index = 0; index < this.bindGroups.length; index++)
        pass.setBindGroup(index, this.bindGroups[index])
    if (this.vertex)
      for (let index = 0; index < this.vertex.length; index++)
        pass.setVertexBuffer(index, this.vertex[index]?.buffer)
    pass.draw(
      typeof this.vertexCount === 'number'
        ? this.vertexCount
        : this.vertexCount(),
      typeof this.instanceCount === 'number'
        ? this.instanceCount
        : this.instanceCount(),
    )
  }
}
