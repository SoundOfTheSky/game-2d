import { ECSSystem } from '../../ecs/system'
import { ChildrenComponent } from '../components/children.component'
import { ParentComponent } from '../components/parent.component'

/**
 * Is allowed to call immediate because of high priority
 */
export default class HierarchySystem extends ECSSystem {
  public priority = 100
  public updatedParents = this.world.updatedComponents.get(ParentComponent)!

  public tick(): void {
    for (const component of this.updatedParents) {
      component.data.previous?.components
        .get(ChildrenComponent)
        ?.data.delete(component.entity)
      component.data.previous = undefined
      // Check if deleted
      if (component.registered) {
        const childrenComponent =
          component.data.entity.components.get(ChildrenComponent) ??
          new ChildrenComponent(component.data.entity, new Set())
        childrenComponent.data.add(component.entity)
        childrenComponent.markUpdated(true)
      } else {
        const childrenComponent =
          component.data.entity.components.get(ChildrenComponent)
        if (childrenComponent) {
          childrenComponent.data.delete(component.entity)
          if (childrenComponent.data.size === 0) childrenComponent.destroy(true)
          else childrenComponent.markUpdated(true)
        }
      }
    }
  }
}
