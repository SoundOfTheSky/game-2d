import { Matrix4 } from './matrix4'
import Vector2 from './vector2'

export class Vector4 {
  public constructor(
    public x = 0,
    public y = 0,
    public z = 0,
    public w = 1,
  ) {}

  // === Mutations ===

  public add(v: Vector4 | number) {
    if (v instanceof Vector4) {
      this.x += v.x
      this.y += v.y
      this.z += v.z
      this.w += v.w
    } else {
      this.x += v
      this.y += v
      this.z += v
      this.w += v
    }
    return this
  }

  public subtract(v: Vector4 | number) {
    if (v instanceof Vector4) {
      this.x -= v.x
      this.y -= v.y
      this.z -= v.z
      this.w -= v.w
    } else {
      this.x -= v
      this.y -= v
      this.z -= v
      this.w -= v
    }
    return this
  }

  public multiply(v: Vector4 | Matrix4 | number) {
    if (v instanceof Matrix4) {
      const x = this.x
      const y = this.y
      const z = this.z
      const w = this.w
      this.x = v.data[0] * x + v.data[4] * y + v.data[8] * z + v.data[12] * w
      this.y = v.data[1] * x + v.data[5] * y + v.data[9] * z + v.data[13] * w
      this.z = v.data[2] * x + v.data[6] * y + v.data[10] * z + v.data[14] * w
      this.w = v.data[3] * x + v.data[7] * y + v.data[11] * z + v.data[15] * w
    } else if (v instanceof Vector4) {
      this.x *= v.x
      this.y *= v.y
      this.z *= v.z
      this.w *= v.w
    } else {
      this.x *= v
      this.y *= v
      this.z *= v
      this.w *= v
    }
    return this
  }

  public divide(v: Vector4 | number) {
    if (v instanceof Vector4) {
      this.x /= v.x
      this.y /= v.y
      this.z /= v.z
      this.w /= v.w
    } else {
      this.x /= v
      this.y /= v
      this.z /= v
      this.w /= v
    }
    return this
  }

  // === Default ===

  public toString() {
    return `Vector4<${this.x},${this.y},${this.z},${this.w}>`
  }

  public *[Symbol.iterator](): Generator<number> {
    yield this.x
    yield this.y
    yield this.z
    yield this.w
  }

  public equals(v: Vector4) {
    return this.x === v.x && this.y === v.y && this.z === v.z && this.w === v.w
  }

  public clone() {
    return new Vector4(this.x, this.y, this.z, this.w)
  }

  public distance(v?: Vector4) {
    if (v) {
      const dx = this.x - v.x
      const dy = this.y - v.y
      const dz = this.z - v.z
      const dw = this.w - v.w
      return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw)
    }
    return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2 + this.w ** 2)
  }

  // === Other ===

  public dot(v: Vector4): number {
    return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w
  }

  public normalize(onlyDecrease?: boolean, maxDistance = 1): this {
    const d = this.distance()
    if (onlyDecrease ? d > maxDistance : d !== 0) {
      const k = maxDistance / d
      this.x *= k
      this.y *= k
      this.z *= k
      this.w *= k
    }
    return this
  }

  public lerp(v: Vector4, t: number): this {
    this.x += (v.x - this.x) * t
    this.y += (v.y - this.y) * t
    this.z += (v.z - this.z) * t
    this.w += (v.w - this.w) * t
    return this
  }

  public xy() {
    return new Vector2(this.x, this.y)
  }

  public yz() {
    return new Vector2(this.y, this.z)
  }
}
