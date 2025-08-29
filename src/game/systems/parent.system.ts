import { ChildrenComponent } from '../components/children.component'
import { ParentComponent } from '../components/parent.component'
import { TransformParentComponent } from '../components/transform.component'
import { ECSQuery } from '../../ecs/query'
import { ECSSystem } from '../../ecs/system'
import DefaultWorld from '../worlds/default.world'

export default class ParentSystem extends ECSSystem {
  public priority = 100
  declare public world: DefaultWorld
  public parentQueue
  public childrenQueue

  public constructor(world: DefaultWorld) {
    super(world)
    this.parentQueue = new ECSQuery(world, {
      any: [TransformParentComponent, ParentComponent],
    })
    this.childrenQueue = new ECSQuery(world, [ChildrenComponent])
  }

  public tick(): void {
    for (const entity of this.parentQueue.matches) {
      const parentComponent =
        entity.components.get(TransformParentComponent) ??
        entity.components.get(ParentComponent)!
      if (
        parentComponent.data.version !== parentComponent.data.entity.version
      ) {
        parentComponent.destroy()
        continue
      }
      const childrenComponent =
        parentComponent.data.entity.components.get(ChildrenComponent) ??
        new ChildrenComponent(parentComponent.data.entity, new Map())
      childrenComponent.data.set(entity, entity.version)
    }
    for (const entity of this.parentQueue.matches) {
      const childrenComponent = entity.components.get(ChildrenComponent)!
      for (const [childEntity, version] of childrenComponent.data) {
        if (childEntity.version !== version)
          childrenComponent.data.delete(childEntity)
      }
      // Immediate because version changed then component is ALREADY deleted
      if (childrenComponent.data.size === 0) childrenComponent.destroy()
    }
  }
}
