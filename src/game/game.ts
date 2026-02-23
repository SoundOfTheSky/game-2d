import ECSWorld from '../ecs/world'

import { initCanvas } from './utils/canvas'

export default class Game {
  public time = 0
  public paused = false

  public constructor(
    public canvas: HTMLCanvasElement,
    public world: ECSWorld,
  ) {
    window.addEventListener('resize', () => initCanvas(canvas))
    initCanvas(canvas)
    document.addEventListener('keypress', (event) => {
      if (event.key === 'p') this.paused = !this.paused
      else if (event.key === ']') this.world.tick(this.world.time + 16.6)
    })
  }

  public tick(time: number) {
    if (!this.paused) this.world.tick(time)
    // let fakeT = 0
    requestAnimationFrame((t) => {
      this.tick(t)
    })
    // setTimeout(() => {
    //   this.tick(performance.now());
    // }, 1);
  }
}
