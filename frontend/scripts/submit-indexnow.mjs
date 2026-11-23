// Tells IndexNow search engines (Bing, Yandex, Seznam, Naver and others) about every URL in
// the sitemap, so they recrawl the site after a deploy instead of waiting to find the change.
// Google does not take part in IndexNow; it reads the sitemap (see robots.txt).
//
// Run from frontend/ after the site is live:  node scripts/submit-indexnow.mjs [--dry-run]
//
// The key is public by design: IndexNow checks that https://<host>/<key>.txt holds the key,
// which proves the submitter controls the site. The key file lives in public/.
import { readFileSync, readdirSync } from 'node:fs'

const ORIGIN = 'https://getmasova.rest'
const ENDPOINT = 'https://api.indexnow.org/indexnow'
const dryRun = process.argv.includes('--dry-run')

const publicDir = new URL('../public/', import.meta.url)
const keyFiles = readdirSync(publicDir).filter((name) => /^[0-9a-f]{32}\.txt$/.test(name))
if (keyFiles.length !== 1) {
  throw new Error(`expected exactly one IndexNow key file (32 hex characters + .txt) in public/, found ${keyFiles.length}`)
}
const key = keyFiles[0].slice(0, -'.txt'.length)
if (readFileSync(new URL(keyFiles[0], publicDir), 'utf8').trim() !== key) {
  throw new Error(`public/${keyFiles[0]} must contain exactly its own key`)
}
const keyLocation = `${ORIGIN}/${key}.txt`

const sitemap = readFileSync(new URL('sitemap.xml', publicDir), 'utf8')
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
if (urlList.length === 0) throw new Error('public/sitemap.xml has no <loc> entries')
const foreign = urlList.filter((url) => !url.startsWith(`${ORIGIN}/`) && url !== ORIGIN)
if (foreign.length > 0) throw new Error(`sitemap URLs outside ${ORIGIN}: ${foreign.slice(0, 3).join(', ')}`)

if (dryRun) {
  console.log(`[dry run] would submit ${urlList.length} URLs with key file ${keyLocation}`)
  process.exit(0)
}

// The engines fetch the key file to verify the submission, so it must be live first.
// A deploy can take a few seconds to reach every edge location: retry briefly.
async function waitForKeyFile() {
  let lastProblem = ''
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      const response = await fetch(keyLocation, { cache: 'no-store', signal: AbortSignal.timeout(15_000) })
      const body = (await response.text()).trim()
      if (response.ok && body === key) return
      lastProblem = `HTTP ${response.status}, body starts "${body.slice(0, 40)}"`
    } catch (error) {
      lastProblem = String(error)
    }
    if (attempt < 6) await new Promise((resolve) => setTimeout(resolve, attempt * 5000))
  }
  throw new Error(`${keyLocation} does not serve the key (${lastProblem}); IndexNow would reject the submission`)
}

async function submit() {
  await waitForKeyFile()
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(ORIGIN).host, key, keyLocation, urlList }),
    signal: AbortSignal.timeout(30_000),
  })
  // 200 = accepted, 202 = accepted, key check pending. Anything else is a rejection.
  if (response.status !== 200 && response.status !== 202) {
    throw new Error(`IndexNow rejected the submission: HTTP ${response.status} ${await response.text()}`)
  }
  console.log(`IndexNow accepted ${urlList.length} URLs (HTTP ${response.status})`)
}

try {
  await submit()
} catch (error) {
  // In GitHub Actions this line becomes a warning in the run summary, with the reason.
  console.log(`::warning title=IndexNow::${String(error.message ?? error).replace(/\r?\n/g, ' ')}`)
  process.exit(1)
}
