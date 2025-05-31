export function initCanvas(
  canvas: HTMLCanvasElement,
  width?: number,
  height?: number,
) {
  const boundingBox = canvas.getBoundingClientRect()
  canvas.width = width ?? boundingBox.width * window.devicePixelRatio
  canvas.height = height ?? boundingBox.height * window.devicePixelRatio
  const context = canvas.getContext('2d')!
  context.imageSmoothingEnabled = false
  context.font = `${32 * window.devicePixelRatio}px Minecraft`
  context.fillStyle = '#AB3F44'
  context.textBaseline = 'top'
  context.textAlign = 'left'
  return { boundingBox, context }
}
