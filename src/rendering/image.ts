import { removeFromArray } from '@softsky/utils'

import imageShaderCode from './image.wgsl?raw'
import { WebGPUMemoryLastArray } from './memory'
import { WebGPUPipeline } from './pipeline'
import { WebGPUSchema, WebGPUSchemaArray } from './schema'
import { device } from './webgpu'

export const imageShader = device.createShaderModule({ code: imageShaderCode })

function createUniform(n: number) {
  return new WebGPUMemoryLastArray(
    new WebGPUSchemaArray(
      new WebGPUSchema({
        matrix: 'mat4x4f', // ####x4 transformation matrix
        uv: 'vec4f', // #### atlas UV left,top,width,height
      }),
      n,
    ),
    GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    (size) => {
      // Don't know
    },
  )
}

const pipelineCombinations: {
  pipelines: WebGPUPipeline<any>[]
  uniform: ReturnType<typeof createUniform>
}[] = [{ pipelines: [], uniform: createUniform(4096) }]

let imageId = 0

export class Image {
  public id
  public data

  protected pipelines: WebGPUPipeline<any>[] = []
  protected uniform = pipelineCombinations[0]!.uniform

  public constructor(public source: GPUTexture) {
    this.id = imageId++
    this.uniform.add(this.id, {
      matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      uv: [0, 0, 1, 1],
    })
    this.data = this.uniform.get(this.id)!
  }

  public addPipeline(pipeline: WebGPUPipeline<any>) {
    this.pipelines.push(pipeline)
    this.updatePipelineUniform()
  }

  public removePipeline(pipeline: WebGPUPipeline<any>) {
    removeFromArray(this.pipelines, pipeline)
    this.updatePipelineUniform()
  }

  protected updatePipelineUniform() {
    const originalUniform = this.uniform
    main: for (let i = 0; i < pipelineCombinations.length; i++) {
      const combo = pipelineCombinations[i]!
      if (combo.pipelines.length !== this.pipelines.length) continue
      for (let j = 0; j < combo.pipelines.length; j++)
        if (combo.pipelines[j] !== this.pipelines[j]) continue main
      this.uniform = combo.uniform
      break
    }
    if (originalUniform === this.uniform) {
      this.uniform = createUniform(512)
      pipelineCombinations.push({
        pipelines: [...this.pipelines],
        uniform: this.uniform,
      })
    }
    originalUniform.remove(this.id)
    this.uniform.add(this.id, this.data)
  }
}

export const imagePipeline = new WebGPUPipeline(imageShaderCode, {})
