import { loadImage } from '../game/utils/files'

/** X and Y are in tiles, not pixels */
export const packTileId = (tilesetIndex: number, x: number, y: number) =>
  (tilesetIndex << 24) | (x << 12) | y

/** X and Y are in tiles, not pixels */
export const unpackTileId = (id: number) => ({
  tilesetIndex: id >> 24,
  x: (id >> 12) & 0xf_ff,
  y: id & 0xf_ff,
})

const unpackAtlasPos = (id: number) => [id >> 13, id & 0b1111111111111] as const

/**
 * Automatically builds an atlas for used textures. Supports simple form of streaming.
 * Simply push tilesets into tilesets array and use tiles by id.
 * Don't forget to use packTileId to generate ids.
 */
export class DynamicAtlas {
  public tilesets: HTMLImageElement[] = []
  public canvas
  protected lookup = new Map<number, number>()
  protected reverseLookup = new Map<number, number>()
  protected ctx
  protected next = 0
  protected maxElements

  public constructor(
    protected readonly tileSize = 16,
    protected readonly atlasSize = 0b10000000000000,
  ) {
    this.canvas = new OffscreenCanvas(this.atlasSize, this.atlasSize)
    this.ctx = this.canvas.getContext('2d')!
    this.maxElements = (atlasSize / this.tileSize) ** 2
  }

  public getUV(id: number) {
    const packed = this.lookup.get(id)!
    if (!packed) throw new Error('Id not registered')
    const [x, y] = unpackAtlasPos(packed)
    return [x / this.atlasSize, y / this.atlasSize]
  }

  public useTile(id: number) {
    if (this.lookup.has(id)) return
    if (this.next === this.maxElements) throw new Error('Atlas is out of space')
    if ((this.next & (this.atlasSize - 1)) === 0)
      console.log(
        '[ATLAS SIZE]',
        ((this.next / this.maxElements) * 100) | 0,
        '%',
      )
    const { tilesetIndex, x, y } = unpackTileId(id)
    const tileset = this.tilesets[tilesetIndex]!
    const [nextX, nextY] = unpackAtlasPos(this.next)
    // Draw
    this.ctx.drawImage(
      tileset,
      x * this.tileSize,
      y * this.tileSize,
      this.tileSize,
      this.tileSize,
      nextX,
      nextY,
      this.tileSize,
      this.tileSize,
    )
    // Set lookup
    this.lookup.set(id, this.next)
    this.reverseLookup.set(this.next, id)
    this.next++
  }

  public deteleTile(id: number) {
    const positionPacked = this.lookup.get(id)
    if (!positionPacked) return
    this.lookup.delete(id)
    this.reverseLookup.delete(positionPacked)
    this.next--
    // Get last packed id and delete it
    const lastId = this.reverseLookup.get(this.next)!
    this.reverseLookup.delete(this.next)
    this.ctx.drawImage(
      this.canvas,
      ...unpackAtlasPos(this.next),
      this.tileSize,
      this.tileSize,
      ...unpackAtlasPos(positionPacked),
      this.tileSize,
      this.tileSize,
    )
    // Set last packed id to this position
    this.lookup.set(lastId, positionPacked)
    this.reverseLookup.set(positionPacked, lastId)
  }
}

const intlCollator = new Intl.Collator()
export const dynamicAtlas16 = new DynamicAtlas(16)
export const dynamicAtlas32 = new DynamicAtlas(32)

dynamicAtlas16.tilesets = await Promise.all(
  Object.keys(import.meta.glob('/public/game/textures16/**/*.webp'))
    .sort((a, b) => intlCollator.compare(a, b))
    .map((url) => loadImage(url.slice(8))),
)

dynamicAtlas32.tilesets = await Promise.all(
  Object.keys(import.meta.glob('/public/game/textures32/**/*.webp'))
    .sort((a, b) => intlCollator.compare(a, b))
    .map((url) => loadImage(url.slice(8))),
)
