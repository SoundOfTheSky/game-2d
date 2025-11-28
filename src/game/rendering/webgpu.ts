export const canvas = document.querySelector('canvas')!
export const context = canvas.getContext('webgpu')!
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (!context) throw new Error('WebGPU is not supported')
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
export const adapter = await navigator.gpu?.requestAdapter({
  powerPreference: 'low-power',
})
if (!adapter) throw new Error('WebGPU is not supported')
export const presentationFormat = navigator.gpu.getPreferredCanvasFormat()
export const device = await adapter.requestDevice()
context.configure({
  device,
  format: presentationFormat,
  alphaMode: 'premultiplied',
})

function setCanvasSize() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}
setCanvasSize()
window.addEventListener('resize', setCanvasSize)
