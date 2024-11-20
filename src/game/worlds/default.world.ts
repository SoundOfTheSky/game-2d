import ECSWorld from '@/game/ecs/world'

export default class DefaultWorld extends ECSWorld {
  public context: CanvasRenderingContext2D

  public constructor(public canvas: HTMLCanvasElement) {
    super()
    this.context = this.canvas.getContext('2d')!
  }
}
