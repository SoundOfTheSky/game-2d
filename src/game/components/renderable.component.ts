import { Optional } from '@softsky/utils'

import ECSComponent from '@/game/ecs/component'

import ECSEntity from '../ecs/entity'
import Vector2 from '../systems/physics/body/vector2'

export type Renderable = {
  source: CanvasImageSource
  size: Vector2
  opacity?: number
  order?: number
  offset?: Vector2
}
/** Requires TransformComponent to be rendered */
export class RenderableComponent extends ECSComponent<Renderable> {
  public constructor(entity: ECSEntity, data: Optional<Renderable, 'size'>) {
    data.size ??= getDimensionsOfImageSource(data.source)
    super(entity, data as Renderable)
  }
}

function getDimensionsOfImageSource(source: CanvasImageSource) {
  if ('naturalWidth' in source)
    return new Vector2(source.naturalWidth, source.naturalHeight)
  if ('videoWidth' in source)
    return new Vector2(source.videoHeight, source.videoWidth)
  if ('codedWidth' in source)
    return new Vector2(source.codedWidth, source.codedHeight)
  if ('width' in source && typeof source.width === 'number')
    return new Vector2(source.width, source.height as number)
  return new Vector2(
    (source.width as unknown as SVGAnimatedLength).baseVal.value,
    (source.height as unknown as SVGAnimatedLength).baseVal.value,
  )
}
