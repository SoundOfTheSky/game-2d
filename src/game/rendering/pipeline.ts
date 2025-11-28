import { Texture } from './texture'
import { Vertex } from './vertex'
import { context, device, presentationFormat } from './webgpu'

// Create a tiny image (checker) and wait for it to load
async function createCheckerImage(): Promise<HTMLImageElement> {
  const c = document.createElement('canvas')
  c.width = 2
  c.height = 2
  const ctx = c.getContext('2d')!
  // draw a 2x2 checker: black/white
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, 2, 2)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, 1, 1)
  ctx.fillRect(1, 1, 1, 1)
  const img = new Image()
  return new Promise((resolve) => {
    img.onload = () => {
      resolve(img)
    }
    img.src = c.toDataURL()
  })
}

const WGSL = `
struct VertexInput {
  @location(0) position: vec2<f32>,
  @location(1) uv: vec2<f32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex fn vs_main(in: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  out.position = vec4(in.position, 0.0, 1.0);
  out.uv = in.uv;
  return out;
}

@group(0) @binding(0) var mySampler: sampler;
@group(0) @binding(1) var myTexture: texture_2d<f32>;

@fragment fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
  let c = textureSample(myTexture, mySampler, in.uv);
  return c;
}
`

export async function createPipelineAndDraw(): Promise<void> {
  // Create image and texture
  const img = await createCheckerImage()
  const texture = new Texture(img)
  // Create a vertex buffer via the existing Vertex helper
  const vertex = new Vertex({ position: 'float32x2', uv: 'float32x2' }, 4)

  // Add quad vertices (triangle-strip order)
  // positions in clip space, uvs 0..1
  vertex.add(0, { position: [-1, -1], uv: [0, 1] })
  vertex.add(1, { position: [1, -1], uv: [1, 1] })
  vertex.add(2, { position: [-1, 1], uv: [0, 0] })
  vertex.add(3, { position: [1, 1], uv: [1, 0] })
  vertex.upload()

  // Create pipeline with auto layout so we can query group layout later
  const shaderModule = device.createShaderModule({ code: WGSL })
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: shaderModule,
      entryPoint: 'vs_main',
      buffers: [vertex.getLayout(0, false)],
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fs_main',
      targets: [{ format: presentationFormat }],
    },
    primitive: { topology: 'triangle-strip', stripIndexFormat: undefined },
  })

  // Create a bind group for the sampler+texture using pipeline's group 0 layout
  const groupLayout = pipeline.getBindGroupLayout(0)
  const textureView = texture.texture.createView()
  const bindGroup = device.createBindGroup({
    layout: groupLayout,
    entries: [
      { binding: 0, resource: texture.sampler },
      { binding: 1, resource: textureView },
    ],
  })

  // Draw once (you can call this in a RAF loop to animate)
  const commandEncoder = device.createCommandEncoder()
  const colorView = context.getCurrentTexture().createView()
  const pass = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: colorView,
        clearValue: { r: 0.2, g: 0.2, b: 0.2, a: 1 },
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
  })
  pass.setPipeline(pipeline)
  pass.setBindGroup(0, bindGroup)
  pass.setVertexBuffer(0, vertex.buffer)
  pass.draw(4, 1, 0, 0)
  pass.end()
  device.queue.submit([commandEncoder.finish()])
}
