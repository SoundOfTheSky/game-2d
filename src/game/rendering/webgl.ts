import { noop } from '@softsky/utils'

export const canvas = document.querySelector('canvas')!
export const gl = canvas.getContext('webgl2', {
  antialias: false,
})!
export const glTextures = new Map<number, WebGLTexture>()

// Resizing canvas
function resizeCanvasToDisplaySize() {
  canvas.width = (window.innerWidth * window.devicePixelRatio) | 0
  canvas.height = (window.innerHeight * window.devicePixelRatio) | 0
  gl.viewport(0, 0, canvas.width, canvas.height)
}
window.addEventListener('resize', resizeCanvasToDisplaySize)
resizeCanvasToDisplaySize()

gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
gl.enable(gl.BLEND)
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

export function compileGLShader(source: string, type: GLenum) {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader))
    throw new Error('Shader compile error')
  }
  return shader
}

export function createGLProgram(vert: WebGLShader, frag: WebGLShader) {
  const program = gl.createProgram()
  gl.attachShader(program, vert)
  gl.attachShader(program, frag)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program))
    throw new Error('Program link error')
  }
  return program
}

export function createGLTexture(texUnit: number, image: TexImageSource) {
  const texture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0 + texUnit)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
  gl.generateMipmap(gl.TEXTURE_2D)
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  glTextures.set(texUnit, texture)
  gl.bindTexture(gl.TEXTURE_2D, null)
  return texture
}

export function getDimensionsOfImageSource(
  source: TexImageSource,
): [number, number] {
  if ('naturalWidth' in source)
    return [source.naturalWidth, source.naturalHeight]
  if ('videoWidth' in source) return [source.videoWidth, source.videoHeight]
  if ('codedWidth' in source) return [source.codedWidth, source.codedHeight]
  if ('width' in source && typeof source.width === 'number')
    return [source.width, source.height]
  throw new Error('Can not determine dimensions')
}

type GLDataForAttributes<A extends Record<string, number>> = {
  [K in keyof A]: number[] & { length: A[K] }
}

export class GLRenderer<InstanceAttributes extends Record<string, number>> {
  public instanceBuffer
  public instanceSize = 0
  public textures = new Map<string, number>()
  public idToIndex = new Map<number, number>()
  public indexToId: number[] = []

  private program: WebGLProgram
  private vao: WebGLVertexArrayObject
  private attributeLocations = new Map<string, number>()
  private uniformLocations = new Map<string, WebGLUniformLocation>()
  private vertCount
  private instanceVBO

  public constructor(
    vert: WebGLShader,
    frag: WebGLShader,
    staticAttributes: Record<string, number>,
    /** Set `as const` for suggestions */
    private instanceAttributes: InstanceAttributes,
    /** Don't forget add texture names to uniforms */
    uniforms: string[],
    staticBuffer: Float32Array,
    public setUniforms: (
      uniformLocations: Map<string, WebGLUniformLocation>,
    ) => unknown = noop,
    private maxInstances = 1024,
  ) {
    this.program = createGLProgram(vert, frag)

    // Calculate static attributes
    let staticStride = 0
    for (const name in staticAttributes) {
      staticStride += staticAttributes[name]! * 4
      this.attributeLocations.set(
        name,
        gl.getAttribLocation(this.program, name),
      )
    }
    this.vertCount = (staticBuffer.byteLength / staticStride) | 0

    // Calculate instance attributes
    for (const name in instanceAttributes) {
      this.instanceSize += instanceAttributes[name]!
      this.attributeLocations.set(
        name,
        gl.getAttribLocation(this.program, name),
      )
    }
    this.instanceBuffer = new Float32Array(
      this.maxInstances * this.instanceSize,
    )

    // Calculate uniforms
    for (const name of uniforms)
      this.uniformLocations.set(
        name,
        gl.getUniformLocation(this.program, name)!,
      )

    // create VAO
    this.vao = gl.createVertexArray()!
    gl.bindVertexArray(this.vao)

    // Register static
    let size = 0
    const staticAttributesArray = Object.entries(staticAttributes)
    if (staticAttributesArray.length !== 0) {
      const staticVBO = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, staticVBO)
      gl.bufferData(gl.ARRAY_BUFFER, staticBuffer, gl.STATIC_DRAW)
      for (const [name, currentSize] of staticAttributesArray) {
        const location = this.attributeLocations.get(name)!
        // Use position
        gl.enableVertexAttribArray(location)
        // Set there to get data from
        gl.vertexAttribPointer(
          location,
          currentSize,
          gl.FLOAT,
          false,
          staticStride,
          size,
        )
        // Update every vertex
        gl.vertexAttribDivisor(location, 0)
        size += currentSize * 4
      }
    }

    // Register instance
    this.instanceVBO = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceVBO)
    gl.bufferData(gl.ARRAY_BUFFER, this.instanceBuffer, gl.DYNAMIC_DRAW)
    size = 0
    for (const name in instanceAttributes) {
      const currentSize = instanceAttributes[name]!
      const position = this.attributeLocations.get(name)!
      // Use position
      gl.enableVertexAttribArray(position)
      // Set there to get data from
      gl.vertexAttribPointer(
        position,
        currentSize,
        gl.FLOAT,
        false,
        this.instanceSize * 4,
        size,
      )
      // Update only on every instance
      gl.vertexAttribDivisor(position, 1)
      size += currentSize * 4
    }

    // Unbind
    gl.bindVertexArray(null)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
  }

  /** Automatically uploads */
  public add(id: number, data: GLDataForAttributes<InstanceAttributes>) {
    if (this.indexToId.length === this.maxInstances)
      throw new Error('Max instances reached')
    if (this.idToIndex.has(id))
      throw new Error(`Instance "${id}" already exists`)

    const offset = this.indexToId.length * this.instanceSize
    let cursor = offset

    for (const name in this.instanceAttributes) {
      const values = data[name]
      this.instanceBuffer.set(values, cursor)
      cursor += values.length
    }

    // Upload
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceVBO)
    gl.bufferSubData(
      gl.ARRAY_BUFFER,
      offset * 4,
      this.instanceBuffer.subarray(offset, offset + this.instanceSize),
    )
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    // Update id mapping
    this.idToIndex.set(id, this.indexToId.length)
    this.indexToId[this.indexToId.length] = id
  }

  /** Automatically uploads */
  public update(
    id: number,
    data: Partial<GLDataForAttributes<InstanceAttributes>>,
  ) {
    const index = this.idToIndex.get(id)
    if (index === undefined) return

    const offset = index * this.instanceSize
    let cursor = offset
    for (const name in this.instanceAttributes) {
      const size = this.instanceAttributes[name]!
      const values = data[name]
      if (values) this.instanceBuffer.set(values, cursor)
      cursor += size
    }

    // Upload
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceVBO)
    gl.bufferSubData(
      gl.ARRAY_BUFFER,
      offset * 4,
      this.instanceBuffer.subarray(offset, offset + this.instanceSize),
    )
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
  }

  /** Automatically uploads */
  public remove(id: number) {
    const index = this.idToIndex.get(id)
    if (!index) return
    this.idToIndex.delete(id)
    const lastId = this.indexToId.pop()!
    if (index === this.indexToId.length) return
    // Copy last instance into the removed slot
    const offset = index * this.instanceSize
    const lastOffset = this.indexToId.length * this.instanceSize
    const updatedInstance = this.instanceBuffer.subarray(
      lastOffset,
      lastOffset + this.instanceSize,
    )
    this.instanceBuffer.set(updatedInstance, offset)

    // Upload
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceVBO)
    gl.bufferSubData(gl.ARRAY_BUFFER, index * 4, updatedInstance)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    // Updare id/index mapping
    this.idToIndex.set(lastId, index)
    this.indexToId[index] = lastId
  }

  /** Call to upload instance buffer after mutation */
  public uploadInstances() {
    gl.bindVertexArray(this.vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceVBO)
    gl.bufferSubData(
      gl.ARRAY_BUFFER,
      0,
      this.instanceBuffer.subarray(
        0,
        this.indexToId.length * this.instanceSize,
      ),
    )
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
  }

  public render() {
    gl.useProgram(this.program)
    this.setUniforms(this.uniformLocations)
    gl.bindVertexArray(this.vao)
    gl.enable(gl.DEPTH_TEST)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // Textures
    for (const [name, id] of this.textures.entries()) {
      gl.activeTexture(gl.TEXTURE0 + id)
      gl.bindTexture(gl.TEXTURE_2D, glTextures.get(id)!)
      gl.uniform1i(this.uniformLocations.get(name)!, id)
    }

    gl.drawArraysInstanced(
      gl.TRIANGLES,
      0,
      this.vertCount,
      this.indexToId.length,
    )
    gl.bindVertexArray(null)
  }
}
