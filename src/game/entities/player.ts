import { AnimationComponent } from '../components/animated.component'
import { HitboxComponent } from '../components/hitbox.component'
import { InputComponent } from '../components/input.component'
import { TransformComponent } from '../components/transform.component'
import { VelocityComponent } from '../components/velocity.component'
import ECSEntity from '../ecs/entity'
import { generateAnimation } from '../systems/animation.system'
import Circle from '../systems/physics/body/circle'
import Vector2 from '../systems/physics/body/vector2'
import { camFollowTag } from '../systems/render.system'
import DefaultWorld from '../worlds/default.world'

export default function createPlayer(world: DefaultWorld, options: {
  position?: Vector2
} = {}) {
  const entity = new ECSEntity(world)
  new TransformComponent(entity, {
    position: options.position,
  })
  const source = world.resources['/game/mc.png'] as HTMLImageElement
  new AnimationComponent(entity, {
    animations: {
      walkUp: generateAnimation(source, 0, 6),
      walkDown: generateAnimation(source, 1, 6),
      walkRight: generateAnimation(source, 2, 6),
      walkLeft: generateAnimation(source, 3, 6),
      idleUp: generateAnimation(source, 4, 5),
      idleDown: generateAnimation(source, 5, 5),
      idleRight: generateAnimation(source, 6, 5),
      idleLeft: generateAnimation(source, 7, 5),
      runUp: generateAnimation(source, 8, 6, undefined, 90),
      runDown: generateAnimation(source, 9, 6, undefined, 90),
      runRight: generateAnimation(source, 10, 6, undefined, 90),
      runLeft: generateAnimation(source, 11, 6, undefined, 90),
      emoteJump: generateAnimation(source, 11, 6, undefined, undefined, false),
    },
  })
  new InputComponent(entity, {
    move: true,
  })
  new VelocityComponent(entity, {
    terminalVelocity: 0.05,
  })
  new HitboxComponent(entity, {
    body: new Circle(new Vector2(16, 24), 8),
    types: new Set(['player']),
    onCollide(myHitbox, otherHitbox, separetionVector) {
      if (otherHitbox.data.types.has('geometry')) {
        const tC = myHitbox.entity.components.get(TransformComponent)!
        tC.data.position.subtract(separetionVector)
      }
    },
  })
  entity.addTag(camFollowTag)
  entity.addTag('debug')
  return entity
}
