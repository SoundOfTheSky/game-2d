import { WebGPUMemory } from './memory'
import { WebGPUSchema } from './schema'

export const globalUniform = new WebGPUMemory(
  new WebGPUSchema({
    camera: 'vec2f',
    time: 'u32',
    zoom: 'f32', // rarely updated
    screenSize: 'vec2f', // rarely updated
  }),
  GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
)
