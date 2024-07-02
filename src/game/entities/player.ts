import Game from '../game';
import { PhysicsBody } from '../physics/body';
import Circle from '../physics/body/circle';
import Vector2 from '../physics/body/vector2';
import AnimatedImg from '../renderable/animated-img';
import { Ticker } from '../ticker';

import Collision from './collision';
import DynamicEntity from './dynamic-entity';
import Entity from './entity';

export default class Player extends DynamicEntity<AnimatedImg, string> {
  public walkSpeed = 0.05;
  public runSpeed = 0.1;
  public isRunning = false;
  public disabledControlsUntil = 0;

  public constructor(game: Game, parent: Ticker, priority?: number) {
    const source = game.resources['/game/mc.png'] as HTMLImageElement;
    const genAnimation = (from: number, to: number) =>
      AnimatedImg.generateAnimation(source, new Vector2(16, 32), from, to, 120, true);
    super(
      game,
      parent,
      new AnimatedImg(game, game, {
        walkUp: genAnimation(0, 5),
        walkDown: genAnimation(6, 11),
        walkRight: genAnimation(12, 17),
        walkLeft: genAnimation(18, 23),
        runUp: genAnimation(0, 5),
        runDown: genAnimation(6, 11),
        runRight: genAnimation(6, 11),
        runLeft: genAnimation(6, 11),
        idleUp: genAnimation(6, 11),
        idleDown: genAnimation(6, 11),
        idleRight: genAnimation(6, 11),
        idleLeft: genAnimation(6, 11),
        fall: genAnimation(6, 11),
        emoteJump: genAnimation(6, 11),
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
    let controlEnabled = this.disabledControlsUntil < this.game.time;
    if (controlEnabled) {
      if (this.game.input.getTicks('main') === 1) {
        this.img.playAnimation('emoteJump');
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.disabledControlsUntil = this.game.time + 2000;
        controlEnabled = false;
      } else {
        this.isRunning = this.game.input.has('run');
        this.maxSpeed = this.isRunning ? this.runSpeed : this.walkSpeed;
        this.velocity.x = this.game.input.move.x;
        this.velocity.y = this.game.input.move.y;
      }
    }
    super.tick(deltaTime);
    if (controlEnabled) this.updateAnimation();
  }

  private updateAnimation() {
    const d = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y) / this.maxSpeed;
    let intendedAnim = 'idle';
    if (d === 0) this.img.speed = 1;
    else {
      intendedAnim = this.isRunning ? 'run' : 'walk';
      this.img.speed = d;
    }
    intendedAnim += this.direction;
    if (this.img.animation !== intendedAnim) this.img.playAnimation(intendedAnim);
  }

  public onCollide(entity: Entity, _hitbox: PhysicsBody, _entityHitbox: PhysicsBody, separationVector: Vector2): void {
    if (entity instanceof Collision) this.pos.move(separationVector);
    else if (entity instanceof Player) this.pos.move(separationVector.scaleN(0.5));
  }
}
