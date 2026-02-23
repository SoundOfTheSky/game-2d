import ECSComponent from '@/ecs/component'

import ECSEntity from '../../ecs/entity'

export type ChildrenComponentData = Set<ECSEntity>
export class ChildrenComponent extends ECSComponent<ChildrenComponentData> {}
