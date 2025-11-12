// === Init Device and Canvas ===
const canvas = document.querySelector('canvas')!
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
const adapter = await navigator.gpu?.requestAdapter()
if (!adapter) throw new Error('WebGPU is not supported')
const device = await adapter.requestDevice()
const context = canvas.getContext('webgpu')
if (!context) throw new Error('WebGPU context is not supported')
context.configure({
  device,
  format: navigator.gpu.getPreferredCanvasFormat(),
})

// === Vertex Data (pos + uv) ===
const vertices = new Float32Array([
  //   x,   y,   u,  v
  // eslint-disable-next-line prettier/prettier
  -1, -1, 0, 0, // 0
  // eslint-disable-next-line prettier/prettier
  1, -1, 1, 0, // 1
  // eslint-disable-next-line prettier/prettier
  1, 1, 1, 1, // 2
  // eslint-disable-next-line prettier/prettier
  -1, 1, 0, 1, // 3
])

const indices = new Uint16Array([0, 1, 2, 0, 2, 3])

const vertexBuf = device.createBuffer({
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
})
device.queue.writeBuffer(vertexBuf, 0, vertices)

const indexBuf = device.createBuffer({
  size: indices.byteLength,
  usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
})
device.queue.writeBuffer(indexBuf, 0, indices)

// === Uniform Buffer (MVP matrix) ===
const uniformBuf = device.createBuffer({
  size: 64, // mat4x4<f32>
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
})

// === Texture + Sampler ===
const img = document.createElement('img')
img.src = 'texture.png'
await img.decode()
const imageBitmap = await createImageBitmap(img)

const texture = device.createTexture({
  size: [imageBitmap.width, imageBitmap.height],
  format: 'rgba8unorm',
  usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
})
device.queue.copyExternalImageToTexture({ source: imageBitmap }, { texture }, [
  imageBitmap.width,
  imageBitmap.height,
])

const sampler = device.createSampler({
  magFilter: 'linear',
  minFilter: 'linear',
})

// === Bind Group Layout / Pipeline ===
const shader = device.createShaderModule({
  code: await (await fetch('shader.wgsl')).text(),
})

const pipeline = device.createRenderPipeline({
  layout: 'auto',
  vertex: {
    module: shader,
    entryPoint: 'vs',
    buffers: [
      {
        arrayStride: 16, // 4 floats = 16 bytes
        attributes: [
          { shaderLocation: 0, offset: 0, format: 'float32x2' },
          { shaderLocation: 1, offset: 8, format: 'float32x2' },
        ],
      },
    ],
  },
  fragment: {
    module: shader,
    entryPoint: 'fs',
    targets: [{ format: context.getCurrentTexture().format }],
  },
  primitive: { topology: 'triangle-list' },
})

// === Bind Group ===
const bindGroup = device.createBindGroup({
  layout: pipeline.getBindGroupLayout(0),
  entries: [
    { binding: 0, resource: { buffer: uniformBuf } },
    { binding: 1, resource: texture.createView() },
    { binding: 2, resource: sampler },
  ],
})

// === Render Loop ===
function frame(t) {
  // Update uniform buffer (MVP)
  const angle = t * 0.001
  const mvp = new Float32Array([
    Math.cos(angle),
    -Math.sin(angle),
    0,
    0,
    Math.sin(angle),
    Math.cos(angle),
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
  ])
  device.queue.writeBuffer(uniformBuf, 0, mvp)

  const encoder = device.createCommandEncoder()
  const pass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: [0.1, 0.1, 0.1, 1],
      },
    ],
  })

  pass.setPipeline(pipeline)
  pass.setBindGroup(0, bindGroup)
  pass.setVertexBuffer(0, vertexBuf)
  pass.setIndexBuffer(indexBuf, 'uint16')
  pass.drawIndexed(6)
  pass.end()

  device.queue.submit([encoder.finish()])
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
