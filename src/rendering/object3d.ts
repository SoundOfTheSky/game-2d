import { removeFromArray } from '@softsky/utils'

import { Matrix4 } from '@/math/matrix4'
import { Vector3 } from '@/math/vector3'

import { LastArrayInSchema, WebGPUMemoryLastArray } from './memory'

let lastObject3DId = 0

export class Object3D {
  public id = ++lastObject3DId
  public rotation = 0
  public translation = new Vector3()
  public scale = new Vector3(1, 1, 1)
  public children: Object3D[] = []
  public parent: Object3D | null = null

  public constructor(
    public memory: WebGPUMemoryLastArray<T>,
    public data: LastArrayInSchema<T> = { matrix: new Matrix4() },
  ) {}

  public upload() {
    this.memory.update(this.id, this.data)
  }

  public updateMatrix(): void {
    this.matrix
      .identity()
      .scale(this.scale)
      .rotateZ(this.rotation)
      .translate(this.translation)
    if (this.parent) this.matrix.multiply(this.parent.matrix)
    for (const child of this.children) child.updateMatrix()
  }

  public add(child: Object3D): void {
    this.children.push(child)
    child.parent = this
  }

  public remove(child: Object3D): void {
    removeFromArray(this.children, child)
    child.parent = null
  }

  public allNodes(acc: Object3D[] = []): Object3D[] {
    acc.push(this)
    for (let index = 0; index < this.children.length; index++)
      this.allNodes(acc)
    return acc
  }
}
