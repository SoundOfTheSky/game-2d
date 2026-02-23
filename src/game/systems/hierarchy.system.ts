import { ECSSystem } from '../../ecs/system'
import { ChildrenComponent } from '../components/children.component'
import { ParentComponent } from '../components/parent.component'

import { SystemPriority } from './system-priority.enum'

/**
 * Is allowed to call immediate because of high priority
 */
export default class HierarchySystem extends ECSSystem {
  public priority = SystemPriority.Hierarchy
  public updatedParents = this.world.updatedComponents.get(ParentComponent)!

  public tick(): void {
    for (const parentComponent of this.updatedParents) {
      parentComponent.data.previous?.components
        .get(ChildrenComponent)
        ?.data.delete(parentComponent.entity)
      parentComponent.data.previous = undefined
      // Check if deleted
      if (parentComponent.registered) {
        const childrenComponent =
          parentComponent.data.entity.components.get(ChildrenComponent) ??
          new ChildrenComponent(parentComponent.data.entity, new Set())
        childrenComponent.data.add(parentComponent.entity)
        childrenComponent.markUpdated(true)
      } else {
        const childrenComponent =
          parentComponent.data.entity.components.get(ChildrenComponent)
        if (childrenComponent) {
          childrenComponent.data.delete(parentComponent.entity)
          if (childrenComponent.data.size === 0) childrenComponent.destroy(true)
          else childrenComponent.markUpdated(true)
        }
      }
    }
  }
}
