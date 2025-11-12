import { ECSSystem } from '../../../ecs/system'
import DefaultWorld from '../../worlds/default.world'

export default class UISystem extends ECSSystem {
  declare public world: DefaultWorld
  public printValues = new Map<string, string | number>()
  public boundingBox!: DOMRect

  public minFPS = 1000
  public startCountTime
  public frames = 0

  protected $element = document.querySelector<HTMLDivElement>('.ui')!
  protected $printValues =
    this.$element.querySelector<HTMLDivElement>('.print-values')!

  public constructor(world: DefaultWorld) {
    super(world)

    this.startCountTime = this.world.time
    document.addEventListener('keydown', (event) => {
      if (event.key === '=') {
        this.minFPS = 1000
        this.startCountTime = this.world.time
        this.frames = 0
      }
    })
  }

  public tick(): void {
    this.calcFPS()
    this.$printValues.innerHTML = ''
    for (const [key, value] of this.printValues) {
      this.$printValues.innerHTML += `${key}: ${value}<br>`
    }
  }

  protected calcFPS() {
    const fps = 1000 / this.world.deltaTime
    if (fps < this.minFPS) this.minFPS = fps
    const medianFPS =
      1000 / ((this.world.time - this.startCountTime) / this.frames++)
    this.printValues.set('FPS', `${~~fps + 1}/${~~this.minFPS}/${~~medianFPS}`)
  }
}
