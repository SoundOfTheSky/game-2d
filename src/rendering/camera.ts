import { PId180 } from '@/math/consts'
import { Matrix4 } from '@/math/matrix4'

import { Object3D } from './object3d'

/**
 * Constructs a camera object. Can be extended to calculate projection matrices.
 */
export class Camera extends Object3D {
  public readonly viewMatrix = new Matrix4()
  public readonly projectionMatrix = new Matrix4()

  public updateMatrix(): void {
    super.updateMatrix()
    this.viewMatrix.copy(this.matrix).invert()
  }
}

/**
 * Constructs a camera with an orthographic projection. Useful for 2D and isometric rendering.
 */
export class OrthographicCamera extends Camera {
  public constructor(
    /** Frustum near plane (minimum). Default is `0.1` */
    public near = 0.1,
    /** Frustum far plane (maximum). Default is `1000` */
    public far = 1000,
    /** Frustum left plane. Default is `-1` */
    public left = -1,
    /** Frustum right plane. Default is `1` */
    public right = 1,
    /** Frustum bottom plane. Default is `-1` */
    public bottom = -1,
    /** Frustum top plane. Default is `1` */
    public top = 1,
  ) {
    super()
  }

  public updateMatrix(): void {
    super.updateMatrix()
    const horizontal = 1 / (this.left - this.right)
    const vertical = 1 / (this.bottom - this.top)
    const depth = 1 / (this.near - this.far)
    const d = this.projectionMatrix

    d[0] = -2 * horizontal
    d[5] = -2 * vertical
    d[10] = 2 * depth
    d[12] = (this.left + this.right) * horizontal
    d[13] = (this.top + this.bottom) * vertical
    d[14] = (this.far + this.near) * depth
  }
}

/**
 * Constructs a camera with a perspective projection. Useful for 3D rendering.
 */
export class PerspectiveCamera extends Camera {
  public constructor(
    /** Vertical field of view in degrees. Default is `75` */
    public fov = 75,
    /** Frustum aspect ratio. Default is `1` */
    public aspect = 1,
    /** Frustum near plane (minimum). Default is `0.1` */
    public near = 0.1,
    /** Frustum far plane (maximum). Default is `1000` */
    public far = 1000,
  ) {
    super()
    this.projectionMatrix[11] = -1
    this.projectionMatrix[15] = 0
  }

  public updateMatrix(): void {
    super.updateMatrix()
    const f = 1 / Math.tan((this.fov * PId180) / 2)
    const depth = 1 / (this.near - this.far)
    const d = this.projectionMatrix
    d[0] = f / this.aspect
    d[5] = f
    d[10] = (this.far + this.near) * depth
    d[14] = 2 * this.far * this.near * depth
  }
}
