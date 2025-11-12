// === Initialization ===
export const canvas = document.querySelector('canvas')!
const context = canvas.getContext('webgpu')!
const presentationFormat = navigator.gpu.getPreferredCanvasFormat()
const adapter = (await navigator.gpu.requestAdapter({
  powerPreference: 'low-power',
}))!
const device = await adapter.requestDevice()
context.configure({
  device,
  format: presentationFormat,
  alphaMode: 'premultiplied',
})
const commandEncoder = device.createCommandEncoder()
const commandBufferArray = new Array<GPUCommandBuffer>(1)
function submitCommandBuffer() {
  commandBufferArray[0] = commandEncoder.finish()
  device.queue.submit(commandBufferArray)
}

// === Resize ===
function setCanvasSize() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}
setCanvasSize()
window.addEventListener('resize', setCanvasSize)

const QUAD = [
  // eslint-disable-next-line prettier/prettier
  -0.5, -0.5, 0, 1,// 1
  // eslint-disable-next-line prettier/prettier
  0.5, -0.5,  1, 1,// 2
  // eslint-disable-next-line prettier/prettier
  -0.5, 0.5, 0, 0, // 3
  // eslint-disable-next-line prettier/prettier
  -0.5, 0.5, 0, 0, // 4
  // eslint-disable-next-line prettier/prettier
  0.5, 0.5, 1, 0, // 5
  // eslint-disable-next-line prettier/prettier
  0.5, -0.5, 1, 1 // 6
]

// =======

// Pad to 16 byte chunks of 2, 4 (std140 layout)
const pad2 = (n: number) => n + (n % 2)
const pad4 = (n: number) => n + ((4 - (n % 4)) % 4)

// convert nested objects into a single array using index without of array.push
const recursiveObjectToArray = (object: any, array: number[], index = 0) => {
  const keys = Object.keys(object)
  for (let index_ = 0; index_ < keys.length; index_++) {
    const key = keys[index_]
    const value = object[key]
    if (value instanceof Object) {
      index = recursiveObjectToArray(value, array, index)
    } else if (Array.isArray(value)) {
      for (let index_ = 0; index_ < value.length; index_++) {
        array[index++] = value[index_]
      }
    } else {
      array[index++] = value
    }
  }
  return index
}

type Uniform = [number, number, number, number] | [number, number] | number

export class UniformBuffer {
  public uniformsArray: Float32Array
  public buffer: GPUBuffer
  public offsets: Float32Array
  public count = 0

  public constructor(protected iniforms: Record<string, Uniform>) {
    let size = 0
    for (const name in iniforms) {
      const currentSize = iniforms[name]!
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

    // Calculate elements count
    const uniformsValues = Object.values(this.iniforms)
    for (let index = 0; index < uniformsValues.length; index++) {
      const value = uniformsValues[index]!
      const pad = value.length == 2 ? pad2 : pad4
      this.count = pad(this.count) + pad(value.length)
    }
    this.count = pad4(this.count)

    this.uniformsArray = new Float32Array(this.count)
    this.offsets = this.initOffsets()
    this.buffer = device.createBuffer({
      size: this.count * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
  }

  getUniformBufferElementsCount = () => {
    const uniforms = Object.values(this.iniforms)

    let size = 0
    for (let index = 0; index < uniforms.length; index++) {
      const u = uniforms[index]!
      const value = u.array
      if (value.length == 1) {
        size += 1
      } else {
        const pad = value.length == 2 ? pad2 : pad4
        size = pad(size) + pad(value.length)
      }

      size += u.extraPadding
    }

    return pad4(size)
  }

  initOffsets = () => {
    const offsets = new Float32Array(Object.keys(this.iniforms).length)
    const values = Object.values(this.iniforms)

    let offset = 0
    for (let index = 0; index < values.length; index++) {
      const u = values[index]
      const value = u.array

      offsets[index] = offset

      if (value.length == 1) {
        offset++
      } else {
        const pad = value.length <= 2 ? pad2 : pad4
        offsets[index] = pad(offset)
        offset = pad(offset) + pad(value.length)
      }

      offset += u.extraPadding
    }

    return offsets
  }

  updateUniformBuffer = () => {
    const uniforms = Object.values(this.iniforms)

    // Pack buffer
    for (let index = 0; index < uniforms.length; index++) {
      const u = uniforms[index]
      const offset = this.offsets[index]

      u.update()

      const value = u.array

      if (value.length == 1) {
        this.uniformsArray[offset] = value[0]
      } else {
        this.uniformsArray.set(value, offset)
      }
    }

    device.queue.writeBuffer(this.buffer, 0, this.uniformsArray.buffer)
  }
}

class FullscreenPass {
  protected bindGroupLayout: GPUBindGroupLayout
  protected bindGroup: GPUBindGroup
  protected renderPipeline: GPURenderPipeline
  protected renderPassDescriptor
  protected uniformBuffer: UniformBuffer // uniform buffer (GPU)

  public constructor(
    protected shaderModule: GPUShaderModule,
    protected uniforms: UniformList<any>,
  ) {
    this.uniformBuffer = new UniformBuffer(renderer, uniforms)
    this.bindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: 'uniform',
          },
        },
      ],
    })
    this.bindGroup = device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.uniformBuffer.buffer,
          },
        },
      ],
    })
    this.renderPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({
        bindGroupLayouts: [this.bindGroupLayout],
      }),
      vertex: {
        module: device.createShaderModule({
          code: this.shader,
        }),
        entryPoint: 'vertMain',
      },
      fragment: {
        module: ,
        entryPoint: 'fragMain',
        targets: [
          {
            format: presentationFormat,
          },
        ],
      },

      primitive: {
        topology: 'triangle-list',
      },
    })
    this.renderPassDescriptor = {
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          clearValue: [1, 1, 1, 1] as const,
          loadOp: 'clear' as const,
          storeOp: 'store' as const,
        },
      ],
    } satisfies GPURenderPassDescriptor
  }

  public draw(commandEncoder: GPUCommandEncoder) {
    this.renderPassDescriptor.colorAttachments[0]!.view = context
      .getCurrentTexture()
      .createView()
    const passEncoder = commandEncoder.beginRenderPass(
      this.renderPassDescriptor,
    )
    passEncoder.setPipeline(this.renderPipeline)
    passEncoder.setBindGroup(0, this.bindGroup)
    passEncoder.draw(6, 1, 0, 0)
    passEncoder.end()
  }

  public render(commandEncoder: GPUCommandEncoder) {
    this.uniformBuffer.updateUniformBuffer()
    this.draw(commandEncoder)
    submitCommandBuffer(device, commandEncoder)
  }
}

const resolutionVec2 = new Vector2()
const uResolution = new Uniform(resolutionVec2)
const uAspect = new Uniform(0)

const updateUniforms = (width: number, height: number) => {
  uResolution.set(resolutionVec2.set(width, height))
  uAspect.set(width / height)
}

export const startApp = async () => {
  const renderer = useRenderer()
  const device = useGpuDevice()

  useResize((width: number, height: number) => {
    updateUniforms(width, height)
  })

  updateUniforms(renderer.width, renderer.height)

  const uTime = new Uniform(0)

  // ! WARNING: Use Vector4 instead of Vector3
  const uColor = new Uniform(new Vector4(1, 0, 0, 1))

  const fullscreenPass = new FullscreenPass(renderer, quadShader, {
    uResolution,
    uAspect,
    uTime,
    uColor,
  })

  useTick(({ timestamp }: TickData) => {
    const commandEncoder = device.createCommandEncoder()
    fullscreenPass.render(commandEncoder, timestamp)

    uTime.set(timestamp / 1000)
  })
}
