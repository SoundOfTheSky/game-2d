import ECSComponent from '@/game/ecs/component'

import ECSEntity from '../ecs/entity'

export class AbilitiesComponent extends ECSComponent<Ability[]> {}

export class Ability {
  protected abilitiesComponent
  public executing = false
  public lastExecutionTime = 0

  // === Settings ===
  public duration?: number
  public controlledDuration?: boolean
  public cooldown?: number
  public uses?: number
  public maxUses?: number
  public restoreUseTime?: number
  // ===

  public constructor(public entity: ECSEntity) {
    this.abilitiesComponent = entity.components.get(AbilitiesComponent) ?? new AbilitiesComponent(entity, [])
    this.abilitiesComponent.data.push(this)
  }

  public destroy() {
    this.abilitiesComponent.data.splice(this.abilitiesComponent.data.indexOf(this), 1)
  }

  public canExecute() {
    if (this.executing) return false
    const deltaTime = this.abilitiesComponent.entity.world.time - this.lastExecutionTime
    if (this.cooldown && deltaTime < this.cooldown) return false
    let uses = this.uses
    if (uses !== undefined) {
      if (this.restoreUseTime) {
        uses += ~~(deltaTime / this.restoreUseTime)
        if (this.maxUses && uses > this.maxUses) uses = this.maxUses
      }
      if (uses === 0) return false
    }
    return { uses, deltaTime }
  }

  public execute() {
    const meta = this.canExecute()
    if (!meta) return false
    this.lastExecutionTime = this.abilitiesComponent.entity.world.time
    if (meta.uses) this.uses = meta.uses - 1
    this.executing = true
    return true
  }

  public update() {
    if (!this.duration
      || this.lastExecutionTime + this.duration < this.abilitiesComponent.entity.world.time) {
      this.stop()
      return false
    }
    return true
  }

  public stop() {
    if (!this.executing) return false
    this.lastExecutionTime = this.abilitiesComponent.entity.world.time
    this.executing = false
    return true
  }
}
