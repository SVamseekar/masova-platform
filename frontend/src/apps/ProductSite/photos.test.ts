import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = resolve(__dirname)
const PUBLIC = resolve(__dirname, '../../../public')

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sources(path)
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
  })
}

/** Every photo path written in the site's source, with where it is written. */
function photoUses(): Map<string, string[]> {
  const uses = new Map<string, string[]>()
  for (const file of sources(ROOT)) {
    const text = readFileSync(file, 'utf8')
    for (const match of text.matchAll(/\/site\/[\w/-]+\.(?:webp|jpg|png)/g)) {
      if (match[0] === '/site/og-image.jpg') continue
      uses.set(match[0], [...(uses.get(match[0]) ?? []), file.slice(ROOT.length + 1)])
    }
  }
  return uses
}

describe('site photos', () => {
  it('shows every photo in one place only', () => {
    for (const [photo, where] of photoUses()) {
      expect(where, `${photo} is used in ${where.join(', ')}`).toHaveLength(1)
    }
  })

  it('points only at photos that exist', () => {
    for (const photo of photoUses().keys()) {
      expect(existsSync(join(PUBLIC, photo)), photo).toBe(true)
    }
  })
})
