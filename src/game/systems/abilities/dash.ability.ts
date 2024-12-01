import { Ability } from '@/game/components/abilities.component'
import { DestroyComponent } from '@/game/components/destroy.component'
import { RenderableComponent } from '@/game/components/renderable.component'
import { TransformComponent } from '@/game/components/transform.component'
import { VelocityComponent } from '@/game/components/velocity.component'
import ECSEntity from '@/game/ecs/entity'

export default class DashAbility extends Ability {
  public cooldown = 250
  public duration = 125
  public controlledDuration = true
  protected velocityComponent
  protected initialTerminalVelocity

  public constructor(entity: ECSEntity) {
    super(entity)
    this.velocityComponent = entity.components.get(VelocityComponent)!
    this.initialTerminalVelocity = this.velocityComponent.data.terminalVelocity
  }

  public update() {
    if (super.update()) {
      this.velocityComponent.data.terminalVelocity = (this.initialTerminalVelocity ?? 0.1) * 4
      const entity = new ECSEntity(this.entity.world)
      const progress = (this.entity.world.time - this.lastExecutionTime) / this.duration
      new TransformComponent(entity, {
        position: this.entity.components.get(TransformComponent)!.data.position.clone(),
        // rotation: (this.entity.world.time - this.lastExecutionTime) / 200 * 2 * Math.PI,
      })
      const renderableComponent = this.entity.components.get(RenderableComponent)!
      new RenderableComponent(entity, {
        source: renderableComponent.data.source,
        offset: renderableComponent.data.offset,
        order: renderableComponent.data.order,
        size: renderableComponent.data.size,
        opacity: 0.25,
      })
      new DestroyComponent(entity, {
        time: 150,
      })
      return true
    }
    return false
  }

  public stop() {
    if (super.stop()) {
      this.velocityComponent.data.terminalVelocity = this.initialTerminalVelocity
      return true
    }
    return false
  }
}
