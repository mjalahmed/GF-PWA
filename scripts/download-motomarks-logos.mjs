#!/usr/bin/env node
/**
 * Download Motomarks badge logos into public/vehicle-logos as small WebP files.
 *
 * Uses Motomarks public-img endpoints (same assets as motomarks.io/logos).
 * Optionally tries authenticated CDN first when VITE_MOTOMARKS_TOKEN is set.
 *
 * Usage:
 *   npm run logos:download
 */
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'public', 'vehicle-logos')
const SLUGS_TS = join(ROOT, 'src', 'lib', 'motomarks', 'slugs.ts')
const CONCURRENCY = 10
const SIZE = 'xs'
const TYPE = 'badge'
const FORMAT = 'webp'

function loadPublishableToken() {
  const fromEnv = process.env.MOTOMARKS_TOKEN || process.env.VITE_MOTOMARKS_TOKEN
  if (fromEnv?.trim()) return fromEnv.trim()
  const envPath = join(ROOT, '.env')
  if (!existsSync(envPath)) return ''
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^VITE_MOTOMARKS_TOKEN=(.*)$/)
    if (m) return m[1].trim().replace(/^["']|["']$/g, '')
  }
  return ''
}

function parseSlugs(ts) {
  return [...ts.matchAll(/^\s*'([a-z0-9-]+)',?\s*$/gm)].map((m) => m[1])
}

function runCwebp(input, output, quality = 68) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'cwebp',
      ['-q', String(quality), '-m', '6', '-resize', '64', '64', input, '-o', output],
      { stdio: 'ignore' },
    )
    child.on('error', reject)
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`cwebp exit ${code}`))))
  })
}

async function fetchLogo(slug, token) {
  const headers = {
    'User-Agent': 'GarageFinderLogoSync/1.0',
    Accept: 'image/webp,image/png,image/*',
    Referer: `https://motomarks.io/logos/${slug}`,
  }

  const candidates = []
  if (token) {
    candidates.push(
      `https://motomarks.io/img/${slug}?token=${encodeURIComponent(token)}&type=${TYPE}&format=${FORMAT}&size=${SIZE}&aspect=square`,
    )
  }
  candidates.push(
    `https://motomarks.io/api/public-img/${slug}?type=${TYPE}&size=${SIZE}&format=${FORMAT}`,
    `https://motomarks.io/api/public-img/${slug}?type=${TYPE}&size=${SIZE}`,
  )

  let lastErr = null
  for (const url of candidates) {
    try {
      const res = await fetch(url, { headers })
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status}`)
        continue
      }
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length < 50) {
        lastErr = new Error('empty body')
        continue
      }
      return buf
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err))
    }
  }
  throw lastErr ?? new Error('fetch failed')
}

async function downloadOne(slug, token) {
  const finalPath = join(OUT_DIR, `${slug}.webp`)
  const tmpRaw = join(OUT_DIR, `.${slug}.raw.bin`)
  const tmpOpt = join(OUT_DIR, `.${slug}.opt.webp`)

  const buf = await fetchLogo(slug, token)
  await writeFile(tmpRaw, buf)

  try {
    await runCwebp(tmpRaw, tmpOpt, 68)
    await rename(tmpOpt, finalPath)
  } catch {
    await rename(tmpRaw, finalPath)
  } finally {
    await rm(tmpRaw, { force: true })
    await rm(tmpOpt, { force: true })
  }

  return (await stat(finalPath)).size
}

async function mapPool(items, limit, fn) {
  let i = 0
  async function worker() {
    while (i < items.length) {
      const idx = i++
      await fn(items[idx], idx)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()))
}

async function main() {
  const token = loadPublishableToken()
  const slugs = parseSlugs(await readFile(SLUGS_TS, 'utf8'))
  await mkdir(OUT_DIR, { recursive: true })
  console.log(`Downloading ${slugs.length} badge logos (${SIZE}/${FORMAT}) → ${OUT_DIR}`)

  let ok = 0
  let fail = 0
  let bytes = 0
  const failures = []

  await mapPool(slugs, CONCURRENCY, async (slug) => {
    try {
      const size = await downloadOne(slug, token)
      ok++
      bytes += size
      if (ok % 25 === 0) console.log(`  … ${ok}/${slugs.length}`)
    } catch (err) {
      fail++
      failures.push(`${slug}: ${err instanceof Error ? err.message : String(err)}`)
    }
  })

  console.log(`Done. ok=${ok} fail=${fail} total≈${(bytes / 1024).toFixed(1)} KiB`)
  if (failures.length) {
    console.log('Failures:')
    for (const f of failures.slice(0, 40)) console.log(' ', f)
    if (failures.length > 40) console.log(`  … +${failures.length - 40} more`)
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
