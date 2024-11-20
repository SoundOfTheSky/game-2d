import ECSWorld from './ecs/world'
import Map from './maps/map'
import Rodosskaya from './maps/rodosskaya'
import Utils from './utils'

export default class Game {
  public static initCanvas(canvas: HTMLCanvasElement, w?: number, h?: number) {
    const boundingBox = canvas.getBoundingClientRect()
    canvas.width = w ?? boundingBox.width * window.devicePixelRatio
    canvas.height = h ?? boundingBox.height * window.devicePixelRatio
    const context = canvas.getContext('2d')!
    context.imageSmoothingEnabled = false
    context.font = `${32 * window.devicePixelRatio}px Minecraft`
    context.fillStyle = '#AB3F44'
    context.textBaseline = 'top'
    context.textAlign = 'left'
    return { boundingBox, ctx: context }
  }

  public ctx!: CanvasRenderingContext2D
  public boundingBox!: DOMRect
  public utils
  public time = 0
  public resources: Record<string, HTMLImageElement | string> = {}
  public world = new ECSWorld()
  public map?: Map

  public constructor(public canvas: HTMLCanvasElement, resources: string[]) {
    window.addEventListener('resize', this.initCanvas.bind(this))
    this.initCanvas()
    void this.preloadResources(resources).then(() => {
      this.map = new Rodosskaya(this)
      // this.addTickable(
      //   new Dialogue(this, this, {
      //     text: 'Господа, это _____pizdec.\nАхуеть<<<<<<Жесть, как сложно делать адаптивный пользовательский интерфейс!',
      //     name: 'Никита',
      //     portrait: new Img(
      //       this,
      //       this,
      //       this.resources['/game/portraits.png'] as HTMLImageElement,
      //       undefined,
      //       new Vector2(64, 64),
      //     ),
      //   }),
      // )
      // this.addTickable(
      //   new UIDynamicPlane(
      //     this,
      //     this,
      //     this.resources['/game/ui.png'] as HTMLImageElement,
      //     new Vector2(),
      //     new Vector2(16, 16),
      //     new Rect(new Vector2(), new Vector2(this.canvas.width, 400)),
      //     8,
      //     true,
      //   ),
      // );
      this.tick(0)
    })

    this.utils = new Utils(this)
  }

  public initCanvas() {
    const c = Game.initCanvas(this.canvas)
    this.boundingBox = c.boundingBox
    this.ctx = c.ctx
  }

  public tick(time: number) {
    const deltaTime = time - this.time
    this.time = time
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.world.update(deltaTime)
    requestAnimationFrame((t) => {
      this.tick(~~t)
    })
    // setTimeout(() => {
    //   this.tick(performance.now());
    // }, 1000);
  }

  private async preloadResources(resources: string[]) {
    const loaded = await Promise.all(
      resources.map(x =>
        x.endsWith('.png') || x.endsWith('.webp')
          ? this.utils.loadImage(x)
          : fetch(x).then(x => x.text()),
      ),
    )
    for (let index = 0; index < loaded.length; index++)
      this.resources[resources[index]!] = loaded[index]!
  }
}
