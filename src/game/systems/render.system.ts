import ECSEntity from '@/ecs/entity'
import { ECSQuery } from '@/ecs/query'
import ECSWorld from '@/ecs/world'
import { PId180 } from '@/math/consts'
import { Matrix4 } from '@/math/matrix4'

import { ECSSystem } from '../../ecs/system'
import { RenderComponent } from '../components/render.component'
import { TransformComponent } from '../components/transform.component'

import { SystemPriority } from './system-priority.enum'

export default class RenderSystem extends ECSSystem {
  public override priority = SystemPriority.Render

  public readonly viewMatrix = new Matrix4()
  public readonly projectionMatrix = new Matrix4()
  public readonly projectionViewMatrix = new Matrix4()

  public updatedRenderComponents =
    this.world.updatedComponents.get(RenderComponent)!

  public query = new ECSQuery(this.world, [TransformComponent, RenderComponent])

  public cameraEntity?: ECSEntity

  /** Vertical field of view in degrees */
  public fov = 75

  /** Frustum aspect ratio */
  public aspect = 1

  /** Frustum near plane */
  public near = 0.1

  /** Frustum far plane*/
  public far = 1000

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

  public commandEncoder!: GPUCommandEncoder

  public constructor(
    world: ECSWorld,
    public readonly renderTargets: { texture: GPUTexture }[],
  ) {
    super(world)
    for (let i = 0; i < this.renderTargets.length; i++) {
      this.descriptor.colorAttachments[i] = {
        view: undefined,
        loadOp: 'clear',
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        storeOp: 'store',
      }
    }
  }

  public tick(): void {
    // Update camera (view and projection matrices)
    const cameraTransformComponent =
      this.cameraEntity?.components.get(TransformComponent)
    if (!cameraTransformComponent) return
    this.viewMatrix.copy(cameraTransformComponent.data.matrix).invert()
    const f = 1 / Math.tan((this.fov * PId180) / 2)
    const depth = 1 / (this.near - this.far)
    const pm = this.projectionMatrix
    pm[0] = f / this.aspect
    pm[5] = f
    pm[10] = (this.far + this.near) * depth
    pm[14] = 2 * this.far * this.near * depth
    this.projectionViewMatrix
      .copy(this.projectionMatrix)
      .multiply(this.viewMatrix)

    // Filter and sort objects to render
    const renderList = []
    for (const entity of this.query.entities) {
      const renderComponent = entity.components.get(RenderComponent)!
      const transformComponent = entity.components.get(TransformComponent)!
      renderList.push({
        renderComponent,
        transformComponent,
      })
    }
    const cameraData = this.projectionViewMatrix
    const cameraX = cameraData[2]!
    const cameraY = cameraData[6]!
    const cameraZ = cameraData[10]!
    renderList.sort((a, b) => {
      const aData = a.transformComponent.data.matrix
      const bData = b.transformComponent.data.matrix
      return (
        cameraX * bData[12]! +
        cameraY * bData[13]! +
        cameraZ * bData[14]! -
        (cameraX * aData[12]! + cameraY * aData[13]! + cameraZ * aData[14]!)
      )
    })

    // Populate descriptor with render targets
    for (let i = 0; i < this.renderTargets.length; i++)
      this.descriptor.colorAttachments[i]!.view =
        this.renderTargets[i]!.texture.createView()
    const pass = this.commandEncoder.beginRenderPass(this.descriptor)
    pass.draw
    //
    // pass.drawIndexed
  }
}
