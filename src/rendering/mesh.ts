import { Matrix4 } from '@/math/matrix4'

import { Object3D } from './object3d'
import { WebGPUVertex } from './vertex'

export type WebGPURenderMode = 'point-list' | 'triangle-list' | 'line-list'

/**
 * Constructs a mesh object. Describes an object with geometry and material.
 */
export class Mesh extends Object3D {
  public readonly modelViewMatrix = new Matrix4()
  public readonly normalMatrix = new Matrix4()
  public mode: WebGPURenderMode = 'triangle-list'
  public instances = 1

  public constructor(
    public vertex?: WebGPUVertex<any>,
    public material = new Material(),
  ) {
    super()
  }
}
