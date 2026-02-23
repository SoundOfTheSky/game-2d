import ECSComponent from '@/ecs/component'

import ECSEntity from '../../ecs/entity'

export type ChildrenComponentData = Set<ECSEntity>

/** Do not create manually! Handled automatically by the HierarchySystem */
export class ChildrenComponent extends ECSComponent<ChildrenComponentData> {}
