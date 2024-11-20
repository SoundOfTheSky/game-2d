import ECSComponent from '@/game/ecs/component'

export default class CanvasComponent extends ECSComponent<HTMLCanvasElement> {
  public context!: CanvasRenderingContext2D

  public set data(value: HTMLCanvasElement) {
    this.context = value.getContext('2d')!
    this._data = value
  }
}
 