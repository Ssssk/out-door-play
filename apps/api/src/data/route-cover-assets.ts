import { access, copyFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { PrismaClient } from '../generated/prisma/client'

export const ROUTE_COVER_ASSETS = [
  { legacyUrl: '/static/routes/card-route-1.jpg', filename: 'card-route-1.jpg', sourcePath: 'routes/card-route-1.jpg' },
  { legacyUrl: '/static/routes/card-route-2.jpg', filename: 'card-route-2.jpg', sourcePath: 'routes/card-route-2.jpg' },
  { legacyUrl: '/static/routes/card-route-3.jpg', filename: 'card-route-3.jpg', sourcePath: 'routes/card-route-3.jpg' },
  { legacyUrl: '/static/fishing/card-fishing-1.jpg', filename: 'card-fishing-1.jpg', sourcePath: 'fishing/card-fishing-1.jpg' },
  { legacyUrl: '/static/fishing/card-fishing-2.jpg', filename: 'card-fishing-2.jpg', sourcePath: 'fishing/card-fishing-2.jpg' },
  { legacyUrl: '/static/fishing/card-fishing-3.jpg', filename: 'card-fishing-3.jpg', sourcePath: 'fishing/card-fishing-3.jpg' },
] as const

export function routeCoverServerUrl(filename: string) {
  return `/v1/uploads/routes/${filename}`
}

function sourceRoots() {
  return [
    join(__dirname, '..', '..', 'seed-assets', 'static'),
    join(process.cwd(), 'seed-assets', 'static'),
    join(process.cwd(), '..', 'mobile', 'src', 'static'),
    join(process.cwd(), 'apps', 'mobile', 'src', 'static'),
  ]
}

async function findSource(sourcePath: string) {
  for (const root of sourceRoots()) {
    const candidate = join(root, sourcePath)
    try {
      await access(candidate)
      return candidate
    } catch {
      // Continue through the local source, compiled image bundle and container candidates.
    }
  }
  throw new Error(`路线封面资源不存在：${sourcePath}`)
}

export async function migrateRouteCoverAssets(prisma: Pick<PrismaClient, 'discovery'>) {
  const uploadDir = join(process.env.UPLOAD_DIR || join(process.cwd(), 'uploads'), 'routes')
  await mkdir(uploadDir, { recursive: true })
  const legacyUrls = ROUTE_COVER_ASSETS.map((asset) => asset.legacyUrl)
  const routes = await prisma.discovery.findMany({
    where: { coverImageUrl: { in: legacyUrls } },
    select: { id: true, coverImageUrl: true },
  })
  let migrated = 0
  for (const asset of ROUTE_COVER_ASSETS) {
    const matchingRoutes = routes.filter((route) => route.coverImageUrl === asset.legacyUrl)
    if (matchingRoutes.length === 0) continue
    const source = await findSource(asset.sourcePath)
    const destination = join(uploadDir, asset.filename)
    await copyFile(source, destination)
    const coverImageUrl = routeCoverServerUrl(asset.filename)
    for (const route of matchingRoutes) {
      const updated = await prisma.discovery.updateMany({
        where: { id: route.id, coverImageUrl: asset.legacyUrl },
        data: { coverImageUrl },
      })
      migrated += updated.count
    }
  }
  return { migrated, matchedLegacyRoutes: routes.length, uploadDir }
}
