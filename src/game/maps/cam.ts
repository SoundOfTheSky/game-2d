import Entity from '../entities/entity';
import Game from '../game';
import Vector2 from '../physics/body/vector2';
import { Tickable, Ticker } from '../ticker';

export type CamAnimation = {
  start: { pos: Vector2; scale: number; time: number };
  delta: { pos?: Vector2; scale?: number; time: number };
};
export const easing = (t: number) => 1 - Math.pow(1 - t, 3);
export default class Cam implements Tickable {
  public constructor(
    protected game: Game,
    public parent: Ticker,
    public priority = 0,
  ) {}

  public pos = new Vector2();
  public max = new Vector2(Infinity, Infinity);
  private _scale = 1;
  public get scale() {
    return this._scale;
  }
  public set scale(value) {
    const dp = value / this._scale;
    this.pos.scaleN(dp);
    this._scale = value;
  }
  public entities: Entity[] = [];
  public followingEntities: Entity[] = [];
  private animation?: CamAnimation;

  public tick() {
    this.updateAnimation();
    this.updateFollowingEntities();
    this.updateOutOfBounds();
    this.updateEntities();
  }

  public animate(animation: CamAnimation['delta']) {
    this.animation = {
      start: {
        scale: this.scale,
        pos: this.pos.clone(),
        time: this.game.time,
      },
      delta: {
        time: animation.time,
      },
    };
    if (animation.pos) this.animation.delta.pos = animation.pos.clone().subtract(this.pos);
    if (animation.scale) this.animation.delta.scale = animation.scale - this.scale;
  }

  protected isOutOfBoundsVisible() {
    return (
      this.pos.x < 0 ||
      this.pos.x > this.max.x * this.scale - this.game.canvas.width ||
      this.pos.y < 0 ||
      this.pos.y > this.max.y * this.scale - this.game.canvas.height
    );
  }

  protected updateOutOfBounds() {
    if (this.isOutOfBoundsVisible()) {
      this.pos.x = Math.max(0, Math.min(this.max.x * this.scale - this.game.canvas.width, this.pos.x));
      this.pos.y = Math.max(0, Math.min(this.max.y * this.scale - this.game.canvas.height, this.pos.y));
      while (this.isOutOfBoundsVisible()) this.scale *= 1.1;
    }
  }

  protected updateAnimation() {
    if (!this.animation) return false;
    let t = (this.game.time - this.animation.start.time) / this.animation.delta.time;
    if (t > 1) t = 1;
    const p = easing(t);
    if (this.animation.delta.pos !== undefined) {
      this.pos.x = ~~(this.animation.start.pos.x + this.animation.delta.pos.x * p);
      this.pos.y = ~~(this.animation.start.pos.y + this.animation.delta.pos.y * p);
    }
    if (this.animation.delta.scale !== undefined)
      this.scale = this.animation.start.scale + this.animation.delta.scale * p;
    if (t === 1) delete this.animation;
    return true;
  }

  protected updateFollowingEntities() {
    if (!this.followingEntities.length) return false;
    const animation = {
      pos: new Vector2(),
      time: 2000,
    };
    for (let i = 0; i < this.followingEntities.length; i++) {
      const entity = this.followingEntities[i];
      animation.pos.x += entity.pos.x * this.scale - this.game.canvas.width / 2;
      animation.pos.y += entity.pos.y * this.scale - this.game.canvas.height / 2;
      if (entity.img) {
        animation.pos.x += (entity.img.size.x * this.scale) / 2;
        animation.pos.y += (entity.img.size.y * this.scale) / 2;
      }
    }
    animation.pos.x /= this.followingEntities.length;
    animation.pos.y /= this.followingEntities.length;
    this.animate(animation);
    return true;
  }

  protected updateEntities() {
    for (let i = 0; i < this.entities.length; i++) {
      const entity = this.entities[i];
      if (!entity.img) continue;
      entity.img.pos.x = (entity.imageOffset.x + entity.pos.x) * this.scale - this.pos.x;
      entity.img.pos.y = (entity.imageOffset.y + entity.pos.y) * this.scale - this.pos.y;
      entity.img.scale = entity.scale * this.scale;
    }
  }
}
