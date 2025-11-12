import { loadImage } from '../utils/files'

import { createGLTexture } from './webgl'

export const packTileId = (tilesetIndex: number, x: number, y: number) =>
  (tilesetIndex << 24) | (x << 12) | y

export const unpackTileId = (id: number) => ({
  tilesetIndex: (id >> 24) & 0xff,
  x: (id >> 12) & 0xf_ff,
  y: id & 0xf_ff,
})

const packAtalasPos = (x: number, y: number) => (x << 16) | y

const unpackAtalasPos = (id: number) =>
  [(id >> 16) & 0xff_ff, id & 0xff_ff] as const

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
  protected nextX = 0
  protected nextY = 0
  protected atlasLimitMax

  public constructor(
    protected tileSize = 16,
    protected atlasSize = 4096,
  ) {
    this.canvas = new OffscreenCanvas(this.atlasSize, this.atlasSize)
    this.atlasLimitMax = this.atlasSize - this.tileSize
    this.ctx = this.canvas.getContext('2d')!
  }

  public getUV(id: number) {
    const packed = this.lookup.get(id)!
    if (!packed) throw new Error('Id not registered')
    const [x, y] = unpackAtalasPos(packed)
    return [x / this.atlasSize, y / this.atlasSize]
  }

  public useTile(id: number) {
    if (this.lookup.has(id)) return
    const { tilesetIndex, x, y } = unpackTileId(id)
    const tileset = this.tilesets[tilesetIndex]!
    // Draw
    this.ctx.drawImage(
      tileset,
      x * this.tileSize,
      y * this.tileSize,
      this.tileSize,
      this.tileSize,
      this.nextX,
      this.nextX,
      this.tileSize,
      this.tileSize,
    )
    // Set lookup
    const pos = packAtalasPos(this.nextX, this.nextY)
    this.lookup.set(id, pos)
    this.reverseLookup.set(pos, id)
    // Overflow position
    this.nextX += this.tileSize
    if (this.nextX > this.atlasLimitMax) {
      if (this.nextY > this.atlasLimitMax)
        throw new Error('Texture atlas overflow')
      this.nextX = 0
      this.nextY += this.tileSize
    }
  }

  public deteleTile(id: number) {
    const positionPacked = this.lookup.get(id)
    if (!positionPacked) return
    this.lookup.delete(id)
    this.reverseLookup.delete(positionPacked)

    // Overflow next
    if (this.nextX < this.tileSize) {
      if (this.nextY < this.tileSize) return
      this.nextX = this.atlasLimitMax
      this.nextY -= this.tileSize
    } else this.nextX -= this.tileSize

    // Get last packed id and delete it
    const lastPacked = packAtalasPos(this.nextX, this.nextY)
    const lastId = this.reverseLookup.get(lastPacked)!
    this.reverseLookup.delete(lastPacked)

    const [x, y] = unpackAtalasPos(positionPacked)
    this.ctx.drawImage(
      this.canvas,
      this.nextX,
      this.nextY,
      this.tileSize,
      this.tileSize,
      x,
      y,
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

createGLTexture(1, dynamicAtlas16.canvas)
createGLTexture(2, dynamicAtlas32.canvas)
