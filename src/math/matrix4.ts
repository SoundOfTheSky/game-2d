import { Vector3 } from './vector3'

export class Matrix4 extends Float32Array {
  public constructor() {
    super(16)
    this.identity()
  }

  public identity(): this {
    this[0] = 1
    this[1] = 0
    this[2] = 0
    this[3] = 0
    this[4] = 0
    this[5] = 1
    this[6] = 0
    this[7] = 0
    this[8] = 0
    this[9] = 0
    this[10] = 1
    this[11] = 0
    this[12] = 0
    this[13] = 0
    this[14] = 0
    this[15] = 1
    return this
  }

  public multiply(t: number | Matrix4): this {
    if (typeof t === 'number') {
      for (let i = 0; i < 16; i++) this[i]! *= t
      return this
    }

    const a = this
    const b = t

    const [
      m00,
      m01,
      m02,
      m03,
      m10,
      m11,
      m12,
      m13,
      m20,
      m21,
      m22,
      m23,
      m30,
      m31,
      m32,
      m33,
    ] = a

    const [
      t00,
      t01,
      t02,
      t03,
      t10,
      t11,
      t12,
      t13,
      t20,
      t21,
      t22,
      t23,
      t30,
      t31,
      t32,
      t33,
    ] = b

    a[0] = m00! * t00! + m10! * t01! + m20! * t02! + m30! * t03!
    a[1] = m01! * t00! + m11! * t01! + m21! * t02! + m31! * t03!
    a[2] = m02! * t00! + m12! * t01! + m22! * t02! + m32! * t03!
    a[3] = m03! * t00! + m13! * t01! + m23! * t02! + m33! * t03!

    a[4] = m00! * t10! + m10! * t11! + m20! * t12! + m30! * t13!
    a[5] = m01! * t10! + m11! * t11! + m21! * t12! + m31! * t13!
    a[6] = m02! * t10! + m12! * t11! + m22! * t12! + m32! * t13!
    a[7] = m03! * t10! + m13! * t11! + m23! * t12! + m33! * t13!

    a[8] = m00! * t20! + m10! * t21! + m20! * t22! + m30! * t23!
    a[9] = m01! * t20! + m11! * t21! + m21! * t22! + m31! * t23!
    a[10] = m02! * t20! + m12! * t21! + m22! * t22! + m32! * t23!
    a[11] = m03! * t20! + m13! * t21! + m23! * t22! + m33! * t23!

    a[12] = m00! * t30! + m10! * t31! + m20! * t32! + m30! * t33!
    a[13] = m01! * t30! + m11! * t31! + m21! * t32! + m31! * t33!
    a[14] = m02! * t30! + m12! * t31! + m22! * t32! + m32! * t33!
    a[15] = m03! * t30! + m13! * t31! + m23! * t32! + m33! * t33!

    return this
  }

  public transpose(): this {
    const tmp01 = this[1]!,
      tmp02 = this[2]!,
      tmp03 = this[3]!,
      tmp12 = this[6]!,
      tmp13 = this[7]!,
      tmp23 = this[11]!

    this[1] = this[4]!
    this[2] = this[8]!
    this[3] = this[12]!
    this[4] = tmp01
    this[6] = this[9]!
    this[7] = this[13]!
    this[8] = tmp02
    this[9] = tmp12
    this[11] = this[14]!
    this[12] = tmp03
    this[13] = tmp13
    this[14] = tmp23

    return this
  }

  public translate(v: Vector3): this {
    const x = v.x
    const y = v.y
    const z = v.z

    this[12]! += this[0]! * x + this[4]! * y + this[8]! * z
    this[13]! += this[1]! * x + this[5]! * y + this[9]! * z
    this[14]! += this[2]! * x + this[6]! * y + this[10]! * z
    this[15]! += this[3]! * x + this[7]! * y + this[11]! * z

    return this
  }

  public scale(v: Vector3): this {
    const x = v.x
    const y = v.y
    const z = v.z

    this[0]! *= x
    this[1]! *= x
    this[2]! *= x
    this[3]! *= x
    this[4]! *= y
    this[5]! *= y
    this[6]! *= y
    this[7]! *= y
    this[8]! *= z
    this[9]! *= z
    this[10]! *= z
    this[11]! *= z

    return this
  }

  public rotateZ(rad: number): this {
    const d = this
    const c = Math.cos(rad)
    const s = Math.sin(rad)
    d[0] = d[0]! * c + d[4]! * s
    d[1] = d[1]! * c + d[5]! * s
    d[2] = d[2]! * c + d[6]! * s
    d[3] = d[3]! * c + d[7]! * s
    d[4] = d[4]! * c - d[0] * s
    d[5] = d[5]! * c - d[1] * s
    d[6] = d[6]! * c - d[2] * s
    d[7] = d[7]! * c - d[3] * s
    return this
  }
}
