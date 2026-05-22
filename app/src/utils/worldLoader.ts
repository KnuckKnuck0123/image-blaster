import worlds from 'virtual:worlds'
import { ViewerQuality, type World, type WorldEntry } from '../types/world'

export function loadWorlds(): WorldEntry[] {
  return worlds as WorldEntry[]
}

export async function fetchWorlds(): Promise<WorldEntry[]> {
  if (!import.meta.env.DEV) return loadWorlds()

  const response = await fetch('/__worlds', { cache: 'no-store' })
  if (!response.ok) throw new Error(await response.text())
  return response.json() as Promise<WorldEntry[]>
}

function localWorldAssetUrl(url: string | undefined): string {
  return url?.startsWith('/worlds/') ? url : ''
}

export function getSplatUrl(world: World, quality = ViewerQuality.High): string {
  const preferredKeys = quality === ViewerQuality.Low
    ? ['150k', '100k', '500k', 'full_res']
    : ['500k', '150k', '100k', 'full_res']

  for (const key of preferredKeys) {
    const plyUrl = world.assets.splats.ply_urls?.[key as keyof NonNullable<World['assets']['splats']['ply_urls']>]
    const spzUrl = world.assets.splats.spz_urls[key as keyof World['assets']['splats']['spz_urls']]
    const localUrl = localWorldAssetUrl(plyUrl) || localWorldAssetUrl(spzUrl)
    if (localUrl) return localUrl
  }

  return ''
}
