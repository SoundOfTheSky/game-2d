import ECSComponent from '@/game/ecs/component'

export default class CanvasComponent extends ECSComponent<HTMLCanvasElement> {
  public context!: CanvasRenderingContext2D

  public updateContext() {
    this.context = this.data.getContext('2d')!
  }
}
