import Input from './input'
import Map from './maps/map'
import Rodosskaya from './maps/rodosskaya'
import Vector2 from './physics/body/vector2'
import FPS from './renderable/fps'
import Img from './renderable/img'
import { Ticker } from './ticker'
import Dialogue from './ui/dialogue'
import Utils from './utils'

const RESOURCE_URLS = [
  '/game/tilesets/1_Generic_16x16.png',
  '/game/tilesets/1_Terrains_and_Fences_16x16.png',
  '/game/tilesets/2_City_Terrains_16x16.png',
  '/game/tilesets/2_LivingRoom_16x16.png',
  '/game/tilesets/3_Bathroom_16x16.png',
  '/game/tilesets/3_City_Props_16x16.png',
  '/game/tilesets/4_Bedroom_16x16.png',
  '/game/tilesets/4_Generic_Buildings_16x16.png',
  '/game/tilesets/5_Classroom_and_library_16x16.png',
  '/game/tilesets/5_Floor_Modular_Buildings_16x16.png',
  '/game/tilesets/6_Garage_Sales_16x16.png',
  '/game/tilesets/6_Music_and_sport_16x16.png',
  '/game/tilesets/7_Art_16x16.png',
  '/game/tilesets/7_Villas_16x16.png',
  '/game/tilesets/8_Gym_16x16.png',
  '/game/tilesets/8_Worksite_16x16.png',
  '/game/tilesets/9_Fishing_16x16.png',
  '/game/tilesets/9_Shopping_Center_and_Markets_16x16.png',
  '/game/tilesets/10_Birthday_party_16x16.png',
  '/game/tilesets/10_Vehicles_16x16.png',
  '/game/tilesets/11_Camping_16x16.png',
  '/game/tilesets/11_Halloween_16x16.png',
  '/game/tilesets/12_Hotel_and_Hospital_16x16.png',
  '/game/tilesets/12_Kitchen_16x16.png',
  '/game/tilesets/13_Conference_Hall_16x16.png',
  '/game/tilesets/13_School_16x16.png',
  '/game/tilesets/14_Basement_16x16.png',
  '/game/tilesets/14_Swimming_Pool_16x16.png',
  '/game/tilesets/15_Christmas_16x16.png',
  '/game/tilesets/15_Police_Station_16x16.png',
  '/game/tilesets/16_Grocery_store_16x16.png',
  '/game/tilesets/16_Office_16x16.png',
  '/game/tilesets/17_Garden_16x16.png',
  '/game/tilesets/17_Visibile_Upstairs_System_16x16.png',
  '/game/tilesets/18_Fire_Station_16x16.png',
  '/game/tilesets/18_Jail_16x16.png',
  '/game/tilesets/19_Graveyard_16x16.png',
  '/game/tilesets/19_Hospital_16x16.png',
  '/game/tilesets/20_Japanese_interiors.png',
  '/game/tilesets/20_Subway_and_Train_Station_16x16.png',
  '/game/tilesets/21_Beach_16x16.png',
  '/game/tilesets/21_Clothing_Store.png',
  '/game/tilesets/22_Museum.png',
  '/game/tilesets/23_Television_and_Film_Studio.png',
  '/game/tilesets/24_Ice_Cream_Shop.png',
  '/game/tilesets/25_Shooting_Range.png',
  '/game/tilesets/26_Condominium.png',
  '/game/tilesets/custom.png',
  '/game/tilesets/Room_Builder_16x16.png',
  '/game/mc.png',
  '/game/ui.png',
  '/game/portraits.png',
  '/game/maps/rodosskaya.json',
  '/game/maps/pyatyorochka.json',
  '/game/maps/wb.json',
  '/game/maps/ozon.json',
  '/game/maps/210.json',
]
export default class Game extends Ticker {
  public ctx!: CanvasRenderingContext2D
  public boundingBox!: DOMRect
  public input
  public utils
  public time = 0
  public resources: Record<string, HTMLImageElement | string> = {}
  public map?: Map

  public constructor(public canvas: HTMLCanvasElement) {
    super()
    window.addEventListener('resize', this.initCanvas.bind(this))
    this.initCanvas()

    this.input = this.addTickable(new Input(this, this))
    this.utils = new Utils(this)
    this.addTickable(new FPS(this, this))

    void this.preloadResources().then(() => {
      this.map = new Rodosskaya(this, this)
      this.addTickable(
        new Dialogue(this, this, {
          text: 'Господа, это _____pizdec.\nАхуеть<<<<<<Жесть, как сложно делать адаптивный пользовательский интерфейс!',
          name: 'Никита',
          portrait: new Img(
            this,
            this,
            this.resources['/game/portraits.png'] as HTMLImageElement,
            undefined,
            new Vector2(64, 64),
          ),
        }),
      )
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
  }

  public initCanvas() {
    const c = Game.initCanvas(this.canvas)
    this.boundingBox = c.boundingBox
    this.ctx = c.ctx
  }

  public tick(time: number) {
    const deltaTime = time - this.time
    this.time = time
    if (deltaTime < 50) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      this.map?.tick(deltaTime)
      super.tick(deltaTime)
    }
    requestAnimationFrame((t) => {
      this.tick(~~t)
    })
    // setTimeout(() => {
    //   this.tick(performance.now());
    // }, 1000);
  }

  public cleanup(): void {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    window.removeEventListener('resize', this.initCanvas)
    super.cleanup()
  }

  private async preloadResources() {
    const loaded = await Promise.all(
      RESOURCE_URLS.map(x =>
        x.endsWith('.png') || x.endsWith('.webp')
          ? this.utils.loadImage(x)
          : fetch(x).then(x => x.text()),
      ),
    )
    for (let index = 0; index < loaded.length; index++)
      this.resources[RESOURCE_URLS[index]!] = loaded[index]!
  }

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

  public createFakeGameContext(overload: Partial<Game>) {
    return { ...this, ...overload }
  }
}
