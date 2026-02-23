import { Vector3 } from '@/math/vector3'

import { Camera } from './camera'
import { Object3D } from './object3d'

export class WebGPURenderer {
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

  protected v = new Vector3()

  public constructor(public readonly renderTargets: { texture: GPUTexture }[]) {
    for (let i = 0; i < this.renderTargets.length; i++) {
      this.descriptor.colorAttachments[i] = {
        view: undefined,
        loadOp: 'clear',
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        storeOp: 'store',
      }
    }
  }

  /** Starts one render pass that will render a scene.
   *
   * Retruns command encoder and accepts render encoder
   */
  public render(
    commandEncoder: GPUCommandEncoder,
    scene: Object3D,
    camera: Camera,
  ): void {
    // Populate descriptor with render targets
    for (let i = 0; i < this.renderTargets.length; i++)
      this.descriptor.colorAttachments[i]!.view =
        this.renderTargets[i]!.texture.createView()

    // Filter and sort objects to render
    const renderList = scene.allNodes()
    const cameraData = camera.projectionViewMatrix.data
    const cameraX = cameraData[2]
    const cameraY = cameraData[6]
    const cameraZ = cameraData[10]
    const cameraW = cameraData[14]
    renderList.sort((a, b) => {
      const aData = a.matrix.data
      const bData = b.matrix.data
      return (
        cameraX * bData[12] +
        cameraY * bData[13] +
        cameraZ * bData[14] +
        cameraW -
        (cameraX * aData[12] +
          cameraY * aData[13] +
          cameraZ * aData[14] +
          cameraW)
      )
    })
    // scene.updateMatrix()

    const pass = commandEncoder.beginRenderPass(this.descriptor)
  }
}
