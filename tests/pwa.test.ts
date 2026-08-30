import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('PWA manifest', () => {
  const manifestPath = resolve(__dirname, '../public/manifest.webmanifest')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))

  it('has required PWA fields', () => {
    expect(manifest.name).toBe('GarageFinder')
    expect(manifest.short_name).toBe('GarageFinder')
    expect(manifest.display).toBe('standalone')
    expect(manifest.start_url).toBe('/')
  })

  it('includes maskable icons', () => {
    const icons = manifest.icons as { purpose: string; sizes: string }[]
    expect(icons.some((i) => i.purpose === 'maskable' && i.sizes === '512x512')).toBe(true)
  })

  it('defines app shortcuts', () => {
    expect(manifest.shortcuts).toHaveLength(2)
    expect(manifest.shortcuts[0].url).toBe('/search')
  })
})

describe('index.html PWA meta', () => {
  const html = readFileSync(resolve(__dirname, '../index.html'), 'utf-8')

  it('links manifest and theme color', () => {
    expect(html).toContain('manifest.webmanifest')
    expect(html).toContain('theme-color')
    expect(html).toContain('apple-touch-icon')
  })
})
