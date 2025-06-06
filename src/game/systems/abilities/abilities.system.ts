import { AbilitiesComponent } from '../../components/abilities.component'
import { InputComponent } from '../../components/input.component'
import { ECSQuery } from '../../ecs/query'
import { ECSSystem } from '../../ecs/system'
import DefaultWorld from '../../worlds/default.world'

export default class AbilitiesSystem extends ECSSystem {
  declare public world: DefaultWorld
  public queue

  public constructor(world: DefaultWorld) {
    super(world)
    this.queue = new ECSQuery(world, [AbilitiesComponent])
  }

  public tick(): void {
    for (const entity of this.queue.matches) {
      const abilitiesComponent = entity.components.get(AbilitiesComponent)!
      const inputComponent = entity.components.get(InputComponent)
      for (let index = 0; index < abilitiesComponent.data.length; index++) {
        const ability = abilitiesComponent.data[index]!
        if (inputComponent) {
          if (inputComponent.data.startAbility.has(ability)) ability.execute()
          else if (
            ability.controlledDuration &&
            inputComponent.data.stopAbility.has(ability)
          )
            ability.stop()
        }
        if (ability.executing) ability.tick()
      }
    }
  }
}
