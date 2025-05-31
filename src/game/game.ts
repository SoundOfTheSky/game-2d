import ECSWorld from './ecs/world'
import { initCanvas } from './utils/canvas'
import { loadImage } from './utils/files'

export default class Game {
  public time = 0
  public resources: Record<string, HTMLImageElement | string> = {}
  public world!: ECSWorld

  public constructor(
    public canvas: HTMLCanvasElement,
    resources: string[],
    createWorld: (game: Game) => ECSWorld,
  ) {
    window.addEventListener('resize', () => initCanvas(canvas))
    initCanvas(canvas)
    void this.preloadResources(resources).then(() => {
      this.world = createWorld(this)
      this.tick(0)
    })
  }

  public tick(time: number) {
    this.world.tick(time)
    // let fakeT = 0
    requestAnimationFrame((t) => {
      this.tick(t)
    })
    // setTimeout(() => {
    //   this.tick(performance.now());
    // }, 1);
  }

  protected async preloadResources(resources: string[]) {
    const loaded = await Promise.all(
      resources.map((file) =>
        file.endsWith('.png') || file.endsWith('.webp')
          ? loadImage(file)
          : fetch(file).then((x) => x.text()),
      ),
    )
    for (let index = 0; index < loaded.length; index++)
      this.resources[resources[index]!] = loaded[index]!
  }
}
