// Writes one HTML file per page of getmasova.rest into dist/, after `vite build`.
// Each file carries that page's own content, title, description, canonical URL and hreflang
// links, so anything that reads the raw HTML (search engines, link previews, AI tools) sees
// the real page. In the browser the app then takes over as usual.
//
// Run by `npm run build` (see the "prerender" script), after the server bundle is built to dist-ssr/.
//
// File names follow Cloudflare's asset rules (wrangler.jsonc): /pricing is served from
// pricing.html and /de/product/kitchen from de/product/kitchen.html, with no trailing slash.
// "/" is index.html, which is also the fallback for the ordering and staff apps, so it gets a
// small inline script that clears the home page content on any other path.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const ssrEntry = new URL('../dist-ssr/prerender.js', import.meta.url)
const manifestPath = `${dist}.vite/manifest.json`

const { prerenderRoutes, renderPage } = await import(ssrEntry.href)
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const template = readFileSync(`${dist}index.html`, 'utf8')
/** Files index.html already links (the main entry, its CSS and its preloads); not linked twice. */
const templateFiles = new Set([...template.matchAll(/(?:href|src)="\/([^"]+)"/g)].map((match) => match[1]))

const FALLBACK_GUARD = "<script>if (location.pathname !== '/') document.getElementById('root').textContent = ''</script>"

/**
 * CSS and JS files of a chunk and of every chunk it imports statically. Stops at the main
 * entry: index.html already links that one and its imports.
 */
function chunkFiles(key, seen = new Set(), files = { css: new Set(), js: new Set() }) {
  if (seen.has(key)) return files
  seen.add(key)
  const chunk = manifest[key]
  if (!chunk) throw new Error(`Vite manifest has no entry for ${key}; did the page move?`)
  if (chunk.isEntry) return files
  files.js.add(chunk.file)
  for (const css of chunk.css ?? []) files.css.add(css)
  for (const imported of chunk.imports ?? []) chunkFiles(imported, seen, files)
  return files
}

/**
 * The page's stylesheets, so it is styled before its code loads, and module preloads,
 * so its code downloads alongside the main bundle instead of after it.
 */
function assetTags(chunkKey) {
  const { css, js } = chunkFiles(chunkKey)
  const notInTemplate = (file) => !templateFiles.has(file)
  return [
    ...[...css].filter(notInTemplate).map((file) => `<link rel="stylesheet" crossorigin href="/${file}">`),
    ...[...js].filter(notInTemplate).map((file) => `<link rel="modulepreload" crossorigin href="/${file}">`),
  ].join('\n    ')
}

/** Replaces exactly one marked region, and fails loudly if the template lost its markers. */
function replaceOnce(html, pattern, value, label) {
  if (!pattern.test(html)) throw new Error(`index.html is missing the ${label} marker`)
  return html.replace(pattern, () => value)
}

function fileFor(path) {
  return path === '/' ? 'index.html' : `${path.slice(1)}.html`
}

const routes = prerenderRoutes()
const written = new Set()
for (const route of routes) {
  const page = renderPage(route)
  let html = template
  html = replaceOnce(html, /<html lang="[^"]*">/, `<html lang="${page.lang}">`, '<html lang>')
  html = replaceOnce(html, /<!--seo:start[\s\S]*?<!--seo:end-->/, `${page.head}\n    ${assetTags(route.chunk)}`, 'seo')
  html = replaceOnce(html, /<!--app:start-->[\s\S]*?<!--app:end-->/, page.body, 'app')
  html = replaceOnce(html, /<!--fallback-guard-->/, route.path === '/' ? FALLBACK_GUARD : '', 'fallback-guard')

  const file = fileFor(route.path)
  if (written.has(file)) throw new Error(`Two pages map to ${file}`)
  written.add(file)
  const target = `${dist}${file}`
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, html)
}

// The manifest is only for this script; keep it off the public site.
if (existsSync(`${dist}.vite`)) rmSync(`${dist}.vite`, { recursive: true })

console.log(`prerender: ${written.size} pages written to dist/`)
