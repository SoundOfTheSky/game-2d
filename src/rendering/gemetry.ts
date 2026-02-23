/**
 * Represents an attribute data view.
 */
export type AttributeData =
  | Float32Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint8Array
  | Uint8ClampedArray
  | Uint16Array
  | Uint32Array

/**
 * Specifies the visible range of vertices or indices to draw when rendering.
 */
export type DrawRange = {
  start: number
  count: number
}

/**
 * Constructs a geometry object. Used to store program attributes.
 */
export class Geometry {
  /**
   * Configures the geometry's {@link DrawRange}.
   */
  drawRange: DrawRange = { start: 0, count: Infinity }

  public constructor(readonly attributes: Record<string, Attribute> = {}) {
    for (const key in attributes) {
      this.attributes[key] = attributes[key]
      this.attributes[key].needsUpdate = true
    }
  }

  /**
   * Disposes geometry from GPU memory.
   */
  dispose(): void {
    // Implemented by renderer
  }
}
