import ECSComponent from '@/ecs/component'

export type InputComponentData = {
  moveToVelocity?: number
  moveToAcceleration?: number
}
export class InputComponent extends ECSComponent<InputComponentData> {}
