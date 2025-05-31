import { pushToSorted } from '@softsky/utils'

import { HitboxComponent } from '../components/hitbox.component'
import { RenderableComponent } from '../components/renderable.component'
import { TransformComponent } from '../components/transform.component'
import { ECSQuery } from '../ecs/query'
import { ECSSystem } from '../ecs/system'
import DefaultWorld from '../worlds/default.world'

import Rect from './physics/body/rect'
import Vector2 from './physics/body/vector2'

export class RenderSystem extends ECSSystem {
  declare public world: DefaultWorld
  public renderables$
  public follow$
  public position = new Vector2()
  public targetPosition = new Vector2()
  public border = new Rect(new Vector2(), new Vector2(Infinity, Infinity))
  public zoom = 1

  public constructor(world: DefaultWorld) {
    super(world)
    this.renderables$ = new ECSQuery(world, [RenderableComponent])
    this.follow$ = new ECSQuery(world, [HitboxComponent, 'camFollow'])
  }

  public tick(): void {
    this.world.context.clearRect(
      0,
      0,
      this.world.canvas.width,
      this.world.canvas.height,
    )
    this.updateEntities()
    this.updateCam()
    this.updateOutOfBounds()
  }

  protected updateEntities() {
    const ordered: {
      renderableComponent: RenderableComponent
      transformComponent: TransformComponent
      order: number
    }[] = []
    for (const entity of this.renderables$.matches) {
      const renderableComponent = entity.components.get(RenderableComponent)!
      const transformComponent =
        entity.components.get(TransformComponent) ??
        new TransformComponent(entity)
      const order =
        renderableComponent.data.order ?? transformComponent.data.position.y
      pushToSorted(
        ordered,
        {
          renderableComponent,
          transformComponent,
          order,
        },
        (entity) => entity.order > order,
      )
    }
    for (let index = 0; index < ordered.length; index++) {
      const { renderableComponent, transformComponent } = ordered[index]!
      if (renderableComponent.data.opacity !== undefined)
        this.world.context.globalAlpha = renderableComponent.data.opacity
      if (transformComponent.data.rotation)
        this.drawRotated(renderableComponent, transformComponent)
      else {
        const zoom = (transformComponent.data.scale ?? 1) * this.zoom
        const x = ~~(
          (transformComponent.data.position.x - this.position.x) *
          this.zoom
        )
        const y = ~~(
          (transformComponent.data.position.y - this.position.y) *
          this.zoom
        )
        const w = ~~(renderableComponent.data.size.x * zoom)
        const h = ~~(renderableComponent.data.size.y * zoom)
        this.world.context.drawImage(
          renderableComponent.data.source,
          renderableComponent.data.offset?.x ?? 0,
          renderableComponent.data.offset?.y ?? 0,
          renderableComponent.data.size.x,
          renderableComponent.data.size.y,
          x,
          y,
          w,
          h,
        )
      }
      this.world.context.globalAlpha = 1
    }
  }

  protected drawRotated(
    renderableComponent: RenderableComponent,
    transformComponent: TransformComponent,
  ) {
    const zoom = (transformComponent.data.scale ?? 1) * this.zoom
    const x = (transformComponent.data.position.x - this.position.x) * this.zoom
    const y = (transformComponent.data.position.y - this.position.y) * this.zoom
    const w = renderableComponent.data.size.x * zoom
    const h = renderableComponent.data.size.y * zoom
    const hw = w / 2
    const hh = h / 2
    this.world.context.translate(x + hw, y + hh)
    this.world.context.rotate(transformComponent.data.rotation!)
    this.world.context.drawImage(
      renderableComponent.data.source,
      renderableComponent.data.offset?.x ?? 0,
      renderableComponent.data.offset?.y ?? 0,
      renderableComponent.data.size.x,
      renderableComponent.data.size.y,
      -hw,
      -hh,
      h,
      w,
    )
    this.world.context.setTransform(1, 0, 0, 1, 0, 0)
  }

  protected updateOutOfBounds() {
    if (this.position.x < this.border.a.x) this.position.x = this.border.a.x
    if (this.position.y < this.border.a.y) this.position.y = this.border.a.y
    const borderX = this.border.b.x - this.world.canvas.width / this.zoom
    const borderY = this.border.b.y - this.world.canvas.height / this.zoom
    if (this.position.x > borderX) this.position.x = borderX
    if (this.position.y > borderY) this.position.y = borderY
  }

  protected updateCam() {
    const p = this.targetPosition
    if (this.follow$.matches.size !== 0) {
      p.x = 0
      p.y = 0
      for (const entity of this.follow$.matches) {
        const center = entity.components
          .get(HitboxComponent)!
          .data.rect?.center()
        if (!center) continue
        p.x += center.x
        p.y += center.y
      }
      p.x =
        p.x / this.follow$.matches.size -
        this.world.canvas.width / 2 / this.zoom
      p.y =
        p.y / this.follow$.matches.size -
        this.world.canvas.height / 2 / this.zoom
    }
    const x = p.x - this.position.x
    const y = p.y - this.position.y
    this.position.x += x / 16
    this.position.y += y / 16
  }
}
