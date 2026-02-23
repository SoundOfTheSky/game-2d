import ECSComponent from '@/ecs/component'
import { WebGPUMemoryLastArray } from '@/rendering/memory'
import { WebGPUTexture } from '@/rendering/texture'

export type RenderData<T = any> = {
  source: WebGPUTexture
  data: T
  memory: WebGPUMemoryLastArray
}
export class RenderComponent extends ECSComponent<RenderData> {}
