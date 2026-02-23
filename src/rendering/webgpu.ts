// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
export const adapter = await navigator.gpu?.requestAdapter()
if (!adapter) throw new Error('WebGPU is not supported')
export const presentationFormat = navigator.gpu.getPreferredCanvasFormat()
export const device = await adapter.requestDevice({
  requiredFeatures: [
    presentationFormat === 'bgra8unorm' && 'bgra8unorm-storage',
  ].filter(Boolean) as GPUFeatureName[],
})
