import { ECSSystem } from '../../../ecs/system'
import DefaultWorld from '../../worlds/default.world'

export default class UISystem extends ECSSystem {
  declare public world: DefaultWorld
  public printValues = new Map<string, string | number>()
  public boundingBox!: DOMRect
  public c
  public printValuesC

  public minFPS = 1000
  public startCountTime
  public frames = 0

  public constructor(world: DefaultWorld) {
    super(world)
    this.c = document.createElement('div')
    this.c.style.position = 'absolute'
    document.body.append(this.c)
    this.printValuesC = document.createElement('div')
    this.printValuesC.style.position = 'absolute'
    this.printValuesC.style.top = '0'
    this.printValuesC.style.right = '0'
    this.c.append(this.printValuesC)

    this.updateContainerSize()
    this.world.canvas.addEventListener(
      'resize',
      this.updateContainerSize.bind(this),
    )

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
    this.printValuesC.innerHTML = ''
    for (const [key, value] of this.printValues) {
      this.printValuesC.innerHTML += `${key}: ${value}<br>`
    }
  }

  protected calcFPS() {
    const fps = 1000 / this.world.deltaTime
    if (fps < this.minFPS) this.minFPS = fps
    const medianFPS =
      1000 / ((this.world.time - this.startCountTime) / this.frames++)
    this.printValues.set('FPS', `${~~fps + 1}/${~~this.minFPS}/${~~medianFPS}`)
  }

  protected updateContainerSize() {
    this.boundingBox = this.world.canvas.getBoundingClientRect()
    this.c.style.left = this.boundingBox.left + 'px'
    this.c.style.top = this.boundingBox.top + 'px'
    this.c.style.width = this.boundingBox.width + 'px'
    this.c.style.height = this.boundingBox.height + 'px'
  }
}
