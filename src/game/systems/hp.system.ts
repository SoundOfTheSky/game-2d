import { HitboxComponent } from '../components/hitbox.component'
import { HPComponent } from '../components/hp.component'
import { ECSQuery } from '../../ecs/query'
import { ECSSystem } from '../../ecs/system'
import DefaultWorld from '../worlds/default.world'

export default class HPSystem extends ECSSystem {
  declare public world: DefaultWorld
  public queue

  public constructor(world: DefaultWorld) {
    super(world)
    this.queue = new ECSQuery(world, [HPComponent])
  }

  public tick(): void {
    for (const entity of this.queue.matches) {
      const hpComponent = entity.components.get(HPComponent)!
      if (
        hpComponent.data.regen &&
        (!hpComponent.data.regenCooldown ||
          !hpComponent.data.lastDamageTime ||
          hpComponent.data.lastDamageTime + hpComponent.data.regenCooldown <
            this.world.time)
      ) {
        hpComponent.data.hp += hpComponent.data.regen * this.world.deltaTime
        if (hpComponent.data.hp > hpComponent.data.maxHP)
          hpComponent.data.hp = hpComponent.data.maxHP
      }
      const hitboxComponentRect =
        entity.components.get(HitboxComponent)?.data.rect
      if (hitboxComponentRect) {
        const x = hitboxComponentRect.a.x
        const y = hitboxComponentRect.b.y
        const fillStyle = this.world.context.fillStyle
        this.world.context.fillStyle = 'gray'
        this.world.context.fillRect(
          x,
          y,
          hitboxComponentRect.w,
          8 * window.devicePixelRatio,
        )
        this.world.context.fillStyle = 'red'
        this.world.context.fillRect(
          x,
          y,
          (hpComponent.data.hp / hpComponent.data.maxHP) *
            hitboxComponentRect.w,
          8 * window.devicePixelRatio,
        )
        this.world.context.fillStyle = fillStyle
        console.log('draw')
      }
    }
  }
}
