import Game from '../game';
import { PhysicsBody } from '../physics/body';
import Circle from '../physics/body/circle';
import Vector2 from '../physics/body/vector2';
import AnimatedImg from '../renderable/animated-img';
import { Ticker } from '../ticker';

import Entity from './entity';

export enum Direction {
  UP = 'Up',
  DOWN = 'Down',
  RIGHT = 'Right',
  LEFT = 'Left',
}

export default class Player extends Entity<AnimatedImg, string> {
  public direction = Direction.DOWN;
  public speed = 0.05;
  public disabledControlsUntil = 0;

  public constructor(game: Game, parent: Ticker, priority?: number) {
    const source = game.resources['/game/mc.png'] as HTMLImageElement;
    super(
      game,
      parent,
      new AnimatedImg(game, game, {
        walkUp: AnimatedImg.generateAnimation(source, new Vector2(16, 32), 0, 5, 120, true),
        walkDown: AnimatedImg.generateAnimation(source, new Vector2(16, 32), 6, 11, 120, true),
        walkRight: AnimatedImg.generateAnimation(source, new Vector2(16, 32), 12, 17, 120, true),
        walkLeft: AnimatedImg.generateAnimation(source, new Vector2(16, 32), 18, 23, 120, true),
        idleUp: AnimatedImg.generateAnimation(source, new Vector2(16, 32), 24, 28, 120, true),
        idleDown: AnimatedImg.generateAnimation(source, new Vector2(16, 32), 29, 33, 120, true),
        idleRight: AnimatedImg.generateAnimation(source, new Vector2(16, 32), 34, 38, 120, true),
        idleLeft: AnimatedImg.generateAnimation(source, new Vector2(16, 32), 39, 43, 120, true),
        emoteJump: AnimatedImg.generateAnimation(source, new Vector2(16, 32), 44, 49, 120),
      }),
      priority,
    );
    this.img.animations.idleUp[0].time = 1200;
    this.img.animations.idleDown[0].time = 1200;
    this.img.animations.idleRight[0].time = 1200;
    this.img.animations.idleLeft[0].time = 1200;
    this.hitboxes.push(new Circle(new Vector2(8, 24), 8));
    this.name = 'player';
  }

  public tick(deltaTime: number): void {
    if (this.disabledControlsUntil < this.game.time) {
      if (this.game.input.checkForKeyPlusRepeat('main')) {
        this.img.playAnimation('emoteJump');
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.disabledControlsUntil = this.game.time + 2000;
      } else {
        this.velocity.x = this.game.input.move.x;
        this.velocity.y = this.game.input.move.y;
        if (this.velocity.x !== 0 || this.velocity.y !== 0) {
          if (Math.abs(this.velocity.y) > Math.abs(this.velocity.x)) {
            if (this.velocity.y > 0) this.direction = Direction.DOWN;
            else this.direction = Direction.UP;
          } else if (this.velocity.x > 0) this.direction = Direction.RIGHT;
          else this.direction = Direction.LEFT;
          this.velocity.normalize(true).scaleN(this.speed);
        }
        this.updateAnimation();
      }
    }
    super.tick(deltaTime);
  }

  private updateAnimation() {
    const d = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y) / this.speed;
    let intendedAnim = 'idle';
    if (d === 0) this.img.speed = 1;
    else {
      intendedAnim = 'walk';
      this.img.speed = d;
    }
    intendedAnim += this.direction;
    if (this.img.animation !== intendedAnim) this.img.playAnimation(intendedAnim);
  }

  public onCollide(entity: Entity, _hitbox: PhysicsBody, _entityHitbox: PhysicsBody, separationVector: Vector2): void {
    if (entity.name === 'collision') this.pos.move(separationVector);
    else if (entity.name === 'player') this.pos.move(separationVector.scaleN(0.5));
  }
}
