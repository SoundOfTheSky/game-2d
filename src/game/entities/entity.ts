import Game from '../game'
import { PhysicsBody } from '../physics/body'
import Vector2 from '../physics/body/vector2'
import AnimatedImg from '../renderable/animated-img'
import Img from '../renderable/img'
import { Ticker } from '../ticker'

export type EntityImage = undefined | AnimatedImg | Img
export default class Entity<IMG extends EntityImage = EntityImage, Meta = unknown> extends Ticker {
  public name = 'default'
  public hitboxes: PhysicsBody[] = []
  public pos = new Vector2()
  public imageOffset = new Vector2()
  public scale = 1
  public hitboxMeta = new WeakMap<PhysicsBody, Meta>()
  private _img!: IMG
  public get img(): IMG {
    return this._img
  }

  public set img(value: IMG) {
    if (this._img) this.removeTickable(this._img)
    this._img = value ? this.addTickable(value) : (undefined as IMG)
  }

  public constructor(
    public game: Game,
    parent: Ticker,
    img?: IMG,
    priority?: number,
  ) {
    super(parent, priority)
    if (img) this.img = img
  }

  public getRelativeHitboxes(): PhysicsBody[] {
    return this.hitboxes.map((hitbox) => {
      const relativeHitbox = hitbox.clone().add(this.pos)
      const meta = this.hitboxMeta.get(hitbox)
      if (meta) this.hitboxMeta.set(relativeHitbox, meta)
      return relativeHitbox
    })
  }

  public onCollide(
    _entity: Entity<undefined | AnimatedImg | Img>,
    _hitbox: PhysicsBody,
    _entityHitbox: PhysicsBody,
    _separationVector: Vector2,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  ): void {}

  public collideEntity(entity: Entity) {
    const hitboxes1 = this.getRelativeHitboxes()
    const hitboxes2 = entity.getRelativeHitboxes()
    for (let index = 0; index < hitboxes1.length; index++) {
      const h1 = hitboxes1[index]!
      for (let index = 0; index < hitboxes2.length; index++) {
        const h2 = hitboxes2[index]!
        const collission = h1.collision(h2)
        if (collission)
          return {
            h1,
            h2,
            collission,
          }
      }
    }
  }
}
