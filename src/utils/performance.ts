import { objectMap } from '@softsky/utils'
import deepPromiseAll from '@softsky/utils/dist/control'

Stats.Panel = function (name, fg, bg) {
  let min = Infinity,
    max = 0,
    round = Math.round
  const PR = round(window.devicePixelRatio || 1)

  const WIDTH = 80 * PR,
    HEIGHT = 48 * PR,
    TEXT_X = 3 * PR,
    TEXT_Y = 2 * PR,
    GRAPH_X = 3 * PR,
    GRAPH_Y = 15 * PR,
    GRAPH_WIDTH = 74 * PR,
    GRAPH_HEIGHT = 30 * PR

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  canvas.style.cssText = 'width:80px;height:48px'

  const context = canvas.getContext('2d')
  context.font = 'bold ' + 9 * PR + 'px Helvetica,Arial,sans-serif'
  context.textBaseline = 'top'

  context.fillStyle = bg
  context.fillRect(0, 0, WIDTH, HEIGHT)

  context.fillStyle = fg
  context.fillText(name, TEXT_X, TEXT_Y)
  context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT)

  context.fillStyle = bg
  context.globalAlpha = 0.9
  context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT)

  return {
    dom: canvas,

    update: function (value, maxValue) {
      min = Math.min(min, value)
      max = Math.max(max, value)

      context.fillStyle = bg
      context.globalAlpha = 1
      context.fillRect(0, 0, WIDTH, GRAPH_Y)
      context.fillStyle = fg
      context.fillText(
        round(value) + ' ' + name + ' (' + round(min) + '-' + round(max) + ')',
        TEXT_X,
        TEXT_Y,
      )

      context.drawImage(
        canvas,
        GRAPH_X + PR,
        GRAPH_Y,
        GRAPH_WIDTH - PR,
        GRAPH_HEIGHT,
        GRAPH_X,
        GRAPH_Y,
        GRAPH_WIDTH - PR,
        GRAPH_HEIGHT,
      )

      context.fillRect(GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, GRAPH_HEIGHT)

      context.fillStyle = bg
      context.globalAlpha = 0.9
      context.fillRect(
        GRAPH_X + GRAPH_WIDTH - PR,
        GRAPH_Y,
        PR,
        round((1 - value / maxValue) * GRAPH_HEIGHT),
      )
    },
  }
}

const WIDTH = 80 * window.devicePixelRatio,
  HEIGHT = 48 * window.devicePixelRatio,
  TEXT_X = 3 * window.devicePixelRatio,
  TEXT_Y = 2 * window.devicePixelRatio,
  GRAPH_X = 3 * window.devicePixelRatio,
  GRAPH_Y = 15 * window.devicePixelRatio,
  GRAPH_WIDTH = 74 * window.devicePixelRatio,
  GRAPH_HEIGHT = 30 * window.devicePixelRatio

export default class PerformanceStat {
  public canvas = document.createElement('canvas')
  public measurements: Record<string, () => number | Promise<number>> = {
    time: () => performance.now(),
  }

  public bg = `#000`
  public fg = `#fff`

  protected context = this.canvas.getContext('2d')!
  protected bytesReady = false
  protected min: Record<string, number> = {}
  protected max: Record<string, number> = {}
  protected measuring = false

  public constructor(public name: string) {
    this.canvas.width = WIDTH
    this.canvas.height = HEIGHT
    this.canvas.style.cssText = 'width:80px;height:48px'

    this.context.font =
      'bold ' + 9 * window.devicePixelRatio + 'px Helvetica,Arial,sans-serif'
    this.context.textBaseline = 'top'

    this.context.fillStyle = this.bg
    this.context.fillRect(0, 0, WIDTH, HEIGHT)

    this.context.fillStyle = this.fg
    this.context.fillText(this.name, TEXT_X, TEXT_Y)
    this.context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT)

    this.context.fillStyle = this.bg
    this.context.globalAlpha = 0.9
    this.context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT)

    if ('measureUserAgentSpecificMemory' in performance)
      this.measurements.bytes = () =>
        (
          performance as unknown as {
            measureUserAgentSpecificMemory: () => Promise<{
              bytes: number
            }>
          }
        )
          .measureUserAgentSpecificMemory()
          .then(({ bytes }) => bytes)
  }

  public start() {
    return
  }

  public async measure() {
    if (this.measuring) return
    this.measuring = true
    try {
      const data = await deepPromiseAll(
        objectMap(this.measurements, (k, v) => [k, v()]) as Record<
          string,
          number
        >,
      )

      let title = ''
      // Draw last values
      this.context.drawImage(
        this.canvas,
        GRAPH_X + window.devicePixelRatio,
        GRAPH_Y,
        GRAPH_WIDTH - window.devicePixelRatio,
        GRAPH_HEIGHT,
        GRAPH_X,
        GRAPH_Y,
        GRAPH_WIDTH - window.devicePixelRatio,
        GRAPH_HEIGHT,
      )
      for (const name in data) {
        const value = data[name]!
        // It's a lie that they will be initialized here but it helps on types
        let min = this.min[name]!
        let max = this.max[name]!
        if (value < min) this.min[name] = min = value
        if (value > max) this.max[name] = max = value
        title += `${name}: ${Math.round(value)} (${Math.round(min)}:${Math.round(max)})`
        // Draw new values
        this.context.fillRect(
          GRAPH_X + GRAPH_WIDTH - window.devicePixelRatio,
          GRAPH_Y,
          window.devicePixelRatio,
          GRAPH_HEIGHT,
        )
      }

      this.context.fillStyle = this.bg
      this.context.globalAlpha = 1
      this.context.fillRect(0, 0, WIDTH, GRAPH_Y)
      this.context.fillStyle = this.fg
      this.context.fillText(title, TEXT_X, TEXT_Y)
      this.context.fillRect(
        GRAPH_X + GRAPH_WIDTH - window.devicePixelRatio,
        GRAPH_Y,
        window.devicePixelRatio,
        GRAPH_HEIGHT,
      )

      this.context.fillStyle = this.bg
      this.context.globalAlpha = 0.9
      this.context.fillRect(
        GRAPH_X + GRAPH_WIDTH - window.devicePixelRatio,
        GRAPH_Y,
        window.devicePixelRatio,
        Math.round((1 - value / maxValue) * GRAPH_HEIGHT),
      )
    } finally {
      this.measuring = false
    }
  }
}
