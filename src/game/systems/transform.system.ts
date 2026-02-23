import { ECSSystem } from '../../ecs/system'
import { ChildrenComponent } from '../components/children.component'
import { ParentComponent } from '../components/parent.component'
import { TransformComponent } from '../components/transform.component'

import { SystemPriority } from './system-priority.enum'

export default class TransformSystem extends ECSSystem {
  public override priority = SystemPriority.Transform

  public updatedTransformComponents =
    this.world.updatedComponents.get(TransformComponent)!

  public tick(): void {
    const toProcess: TransformComponent[] = []

    // Find roots of updated transform trees
    for (const transformComponent of this.updatedTransformComponents) {
      let p: TransformComponent | undefined =
        transformComponent.entity.components
          .get(ParentComponent)
          ?.data.entity.components.get(TransformComponent)
      let process = true
      while (p) {
        if (this.updatedTransformComponents.has(p)) {
          process = false
          break
        }
        p = transformComponent.entity.components
          .get(ParentComponent)
          ?.data.entity.components.get(TransformComponent)
      }
      if (process) toProcess.push(transformComponent)
    }

    // Process transform trees
    for (let index = 0; index < toProcess.length; index++) {
      const transformComponent = toProcess[index]!
      const parentTransformComponent = transformComponent.entity.components
        .get(ParentComponent)
        ?.data.entity.components.get(TransformComponent)
      const m = transformComponent.data.matrix

      // Get initial matrix from parent if exists
      if (parentTransformComponent) m.copy(parentTransformComponent.data.matrix)
      else m.identity()

      // Apply transforms
      if (transformComponent.data.rotation)
        m.rotateZ(transformComponent.data.rotation)
      if (transformComponent.data.scale) m.scale(transformComponent.data.scale)
      m.translate(transformComponent.data.position)
      if (transformComponent.data.pivotRotation)
        m.rotateZ(transformComponent.data.pivotRotation)

      // Append children to process list
      const childrenComponent =
        transformComponent.entity.components.get(ChildrenComponent)
      if (childrenComponent)
        for (const child of childrenComponent.data) {
          const childTransformComponent =
            child.components.get(TransformComponent)
          if (childTransformComponent) toProcess.push(childTransformComponent)
        }
    }
  }
}
