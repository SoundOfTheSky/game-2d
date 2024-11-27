import { AnimationComponent } from '../components/animated.component'
import {
  getDirectionStringFromVector2,
  VelocityComponent,
} from '../components/velocity.component'
import { ECSQuery } from '../ecs/query'
import { ECSSystem } from '../ecs/system'
import DefaultWorld from '../worlds/default.world'

export default class TriggerAnimationSystem extends ECSSystem {
  public declare world: DefaultWorld
  public moveAnimation$

  public constructor(world: DefaultWorld) {
    super(world)
    this.moveAnimation$ = new ECSQuery(world, [
      AnimationComponent,
      VelocityComponent,
    ])
  }

  public update(): void {
    for (const entity of this.moveAnimation$.matches) {
      const animatedComponent = entity.components.get(AnimationComponent)!
      const velocityComponent = entity.components.get(VelocityComponent)!
      let intendedAnim = 'idle'
      const d = velocityComponent.data.velocity.distance()
      const terminalVelocityPercent
        = d / (velocityComponent.data.terminalVelocity ?? 1)
      if (d === 0) {
        animatedComponent.data.speed = 1
        intendedAnim
          = 'idle'
          + getDirectionStringFromVector2(velocityComponent.data.lastDirection)
      }
      else {
        // Set animation speed to how close we are to the terminal velocity
        animatedComponent.data.speed = terminalVelocityPercent
        intendedAnim
          = (d > 0.06 ? 'run' : 'walk')
          + getDirectionStringFromVector2(velocityComponent.data.velocity)
      }
      animatedComponent.playIfNotPlaying(intendedAnim)
    }
  }
}
