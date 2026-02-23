import ECSComponent from '@/ecs/component'
import { WebGPUTexture } from '@/rendering/texture'

export type RenderableData = {
  texture: WebGPUTexture
}
export class RenderableComponent extends ECSComponent<RenderableData> {}
