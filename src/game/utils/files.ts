// eslint-disable-next-line import-x/prefer-default-export
export function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = document.createElement('img')
    img.src = url
    img.addEventListener('load', () => {
      resolve(img)
    })
    img.addEventListener('onerror', reject)
  })
}
