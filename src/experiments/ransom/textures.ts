// Les textures sont lues directement depuis ransom/textures/{paper,color} :
// déposer un fichier dans le dossier suffit (les exports ransom-*.png sont ignorés).
const paperFiles = import.meta.glob('/ransom/textures/paper/*.{png,jpg,jpeg,webp,avif}', { eager: true, query: '?url', import: 'default' })
const colorFiles = import.meta.glob(['/ransom/textures/color/*.{png,jpg,jpeg,webp,avif}', '!/ransom/textures/color/ransom-*'], {
  eager: true,
  query: '?url',
  import: 'default',
})

const urls = (files: Record<string, unknown>) =>
  Object.keys(files)
    .sort()
    .map((k) => files[k] as string)

export const PAPER_URLS = urls(paperFiles)
export const COLOR_URLS = urls(colorFiles)
export const PAPER_COUNT = PAPER_URLS.length
export const COLOR_COUNT = COLOR_URLS.length

export interface Textures {
  paper: HTMLImageElement[]
  color: HTMLImageElement[]
}

function load(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`texture introuvable: ${url}`))
    img.src = url
  })
}

let cache: Promise<Textures> | null = null
export function loadTextures(): Promise<Textures> {
  cache ??= (async () => {
    const [paper, color] = await Promise.all([Promise.all(PAPER_URLS.map(load)), Promise.all(COLOR_URLS.map(load))])
    return { paper, color }
  })()
  return cache
}

// Texture papier appliquée par-dessus toute la note (option). Chargée seulement si activée.
import overlayUrl from '/ransom/textures/paper_LG.jpg'

let overlayCache: Promise<HTMLImageElement> | null = null
export function loadOverlay(): Promise<HTMLImageElement> {
  overlayCache ??= load(overlayUrl)
  return overlayCache
}
