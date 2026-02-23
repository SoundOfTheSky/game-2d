import { Matrix4 } from './matrix4'
import Vector2 from './vector2'

export class Vector3 {
  public constructor(
    public x = 0,
    public y = 0,
    public z = 0,
  ) {}

  // === Mutations ===

  public rotateZ(angle: number, pivot = new Vector3()) {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const dx = this.x - pivot.x
    const dy = this.y - pivot.y
    this.x = cos * dx - sin * dy + pivot.x
    this.y = sin * dx + cos * dy + pivot.y
    return this
  }

  public rotateY(angle: number, pivot = new Vector3()) {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const dx = this.x - pivot.x
    const dz = this.z - pivot.z
    this.x = cos * dx - sin * dz + pivot.x
    this.z = sin * dx + cos * dz + pivot.z
    return this
  }

  public rotateX(angle: number, pivot = new Vector3()) {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const dz = this.z - pivot.z
    const dy = this.y - pivot.y
    this.z = cos * dz - sin * dy + pivot.z
    this.y = sin * dz + cos * dy + pivot.y
    return this
  }

  public add(v: Vector3 | number) {
    if (v instanceof Vector3) {
      this.x += v.x
      this.y += v.y
      this.z += v.z
    } else {
      this.x += v
      this.y += v
      this.z += v
    }
    return this
  }

  public subtract(v: Vector3 | number) {
    if (v instanceof Vector3) {
      this.x -= v.x
      this.y -= v.y
      this.z -= v.z
    } else {
      this.x -= v
      this.y -= v
      this.z -= v
    }
    return this
  }

  public multiply(v: Vector3 | Matrix4 | number) {
    if (v instanceof Vector3) {
      this.x *= v.x
      this.y *= v.y
      this.z *= v.z
    } else if (v instanceof Matrix4) {
      const data = v.data
      const x = this.x
      const y = this.y
      const z = this.z
      this.x = data[0] * x + data[4] * y + data[8] * z + data[12]
      this.y = data[1] * x + data[5] * y + data[9] * z + data[13]
      this.z = data[2] * x + data[6] * y + data[10] * z + data[14]
      const d =
        data[3] * this.x + data[7] * this.y + data[11] * this.z + data[15] || 1
      this.x /= d
      this.y /= d
      this.z /= d
    } else {
      this.x *= v
      this.y *= v
      this.z *= v
    }
    return this
  }

  public divide(v: Vector3 | number) {
    if (v instanceof Vector3) {
      this.x /= v.x
      this.y /= v.y
      this.z /= v.z
    } else {
      this.x /= v
      this.y /= v
      this.z /= v
    }
    return this
  }

  // === Default ===

  public toString() {
    return `Vector3<${this.x},${this.y},${this.z}>`
  }

  public *[Symbol.iterator](): Generator<number> {
    yield this.x
    yield this.y
    yield this.z
  }

  public equals(v: Vector3) {
    return this.x === v.x && this.y === v.y && this.z === v.z
  }

  public clone() {
    return new Vector3(this.x, this.y, this.z)
  }

  // === Other ===

  public distance(v?: Vector3) {
    if (v) {
      const dx = this.x - v.x
      const dy = this.y - v.y
      const dz = this.z - v.z
      return Math.sqrt(dx * dx + dy * dy + dz * dz)
    }
    return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2)
  }

  public normalize(onlyDecrease?: boolean, maxDistance = 1): this {
    const d = this.distance()
    if (onlyDecrease ? d > maxDistance : d !== 0) {
      const k = maxDistance / d
      this.x *= k
      this.y *= k
      this.z *= k
    }
    return this
  }

  public dot(v: Vector3): number {
    return this.x * v.x + this.y * v.y + this.z * v.z
  }

  public lerp(v: Vector3, t: number): this {
    this.x += (v.x - this.x) * t
    this.y += (v.y - this.y) * t
    this.z += (v.z - this.z) * t
    return this
  }

  public cross(v: Vector3): this {
    this.x = this.y * v.z - this.z * v.y
    this.y = this.z * v.x - this.x * v.z
    this.z = this.x * v.y - this.y * v.x
    return this
  }

  public xy() {
    return new Vector2(this.x, this.y)
  }

  public yz() {
    return new Vector2(this.y, this.z)
  }
}
