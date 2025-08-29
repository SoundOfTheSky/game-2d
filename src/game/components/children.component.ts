import ECSComponent from '@/ecs/component'

import ECSEntity from '../../ecs/entity'

export type ChildrenComponentData = Map<ECSEntity, number>
export class ChildrenComponent extends ECSComponent<ChildrenComponentData> {}
