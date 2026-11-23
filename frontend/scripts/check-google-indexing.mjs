// Asks Google Search Console, page by page, whether each sitemap URL is indexed, and prints
// a summary plus the pages that are not. Read-only: it never asks Google to index anything.
//
// Setup (once):
//   1. Google Cloud console: create a project, enable "Google Search Console API",
//      create a service account and download its JSON key. Keep the key out of git.
//   2. Search Console > Settings > Users and permissions > Add user: the service account's
//      e-mail address, permission Full.
//
// Run from frontend/:
//   GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node scripts/check-google-indexing.mjs [--json out.json]
//
// SC_SITE_URL names the Search Console property: "sc-domain:getmasova.rest" (the default) for a
// domain property, or "https://getmasova.rest/" for a URL-prefix property.
// Quota: 2,000 inspections a day and 600 a minute per property; one run uses one per URL.
import { createSign } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

const SITE_URL = process.env.SC_SITE_URL || 'sc-domain:getmasova.rest'
const CONCURRENCY = 4
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
if (!credentialsPath) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to the service account JSON key file (see the setup notes at the top of this script).')
  process.exit(2)
}
const jsonFlag = process.argv.indexOf('--json')
const jsonOut = jsonFlag === -1 ? null : process.argv[jsonFlag + 1]
if (jsonFlag !== -1 && !jsonOut) {
  console.error('--json needs a file path')
  process.exit(2)
}

const credentials = JSON.parse(readFileSync(credentialsPath, 'utf8'))
if (credentials.type !== 'service_account' || !credentials.private_key || !credentials.client_email) {
  console.error(`${credentialsPath} is not a service account key (expected "type": "service_account")`)
  process.exit(2)
}

/** OAuth access token for the service account, from a self-signed JWT (no client library needed). */
async function accessToken() {
  const base64url = (value) => Buffer.from(value).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64url(JSON.stringify({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))
  const signature = createSign('RSA-SHA256').update(`${header}.${claims}`).sign(credentials.private_key, 'base64url')
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    signal: AbortSignal.timeout(30_000),
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claims}.${signature}`,
    }),
  })
  const body = await response.json()
  if (!response.ok) throw new Error(`token request failed: HTTP ${response.status} ${JSON.stringify(body)}`)
  return body.access_token
}

const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8')
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
if (urls.length === 0) throw new Error('public/sitemap.xml has no <loc> entries')
const token = await accessToken()

/** Permission or quota problems apply to every URL: they stop the run, keeping what was checked. */
class StopRun extends Error {}

async function inspect(url) {
  let response
  let body
  try {
    response = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inspectionUrl: url, siteUrl: SITE_URL }),
      signal: AbortSignal.timeout(60_000),
    })
    const text = await response.text()
    try {
      body = JSON.parse(text)
    } catch {
      // A gateway error can answer with an HTML page instead of JSON.
      body = { error: { message: text.slice(0, 200) } }
    }
  } catch (error) {
    // A network failure on one URL is reported in that URL's row; the run carries on.
    return { url, verdict: 'ERROR', coverageState: `request failed: ${error}` }
  }
  if (!response.ok) {
    const message = body.error?.message || JSON.stringify(body)
    if (response.status === 403 || response.status === 429) {
      throw new StopRun(`HTTP ${response.status} on ${url}: ${message}` +
        (response.status === 403 ? `\nCheck that ${credentials.client_email} is a user of the Search Console property ${SITE_URL}.` : ''))
    }
    return { url, verdict: 'ERROR', coverageState: `HTTP ${response.status}: ${message}` }
  }
  const index = body.inspectionResult?.indexStatusResult ?? {}
  return {
    url,
    verdict: index.verdict ?? 'UNKNOWN',
    coverageState: index.coverageState ?? 'unknown',
    lastCrawlTime: index.lastCrawlTime ?? null,
    googleCanonical: index.googleCanonical ?? null,
  }
}

const results = []
let next = 0
let stopError = null
async function worker() {
  while (next < urls.length && !stopError) {
    const url = urls[next]
    next += 1
    try {
      results.push(await inspect(url))
    } catch (error) {
      if (!(error instanceof StopRun)) throw error
      stopError ??= error
      return
    }
    if (results.length % 25 === 0) console.error(`  ${results.length}/${urls.length} inspected`)
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker))
results.sort((a, b) => urls.indexOf(a.url) - urls.indexOf(b.url))

const failed = results.filter((result) => result.verdict === 'ERROR')
const checked = results.filter((result) => result.verdict !== 'ERROR')
const byState = new Map()
for (const result of checked) byState.set(result.coverageState, (byState.get(result.coverageState) ?? 0) + 1)
const indexed = checked.filter((result) => result.verdict === 'PASS')
const notIndexed = checked.filter((result) => result.verdict !== 'PASS')
// Google picked a different page as the canonical: usually a sign it sees the two as duplicates.
const otherCanonical = checked.filter((result) => result.googleCanonical && result.googleCanonical !== result.url)

console.log(`\n${indexed.length} of ${checked.length} checked URLs indexed (${SITE_URL}); ${urls.length} in the sitemap\n`)
for (const [state, count] of [...byState].sort((a, b) => b[1] - a[1])) console.log(`  ${String(count).padStart(4)}  ${state}`)
if (notIndexed.length > 0) {
  console.log('\nNot indexed:')
  for (const result of notIndexed) console.log(`  ${result.url}  (${result.coverageState})`)
}
if (otherCanonical.length > 0) {
  console.log('\nGoogle chose a different canonical:')
  for (const result of otherCanonical) console.log(`  ${result.url}  ->  ${result.googleCanonical}`)
}
if (failed.length > 0) {
  console.log('\nLookups failed (status unknown, not counted above):')
  for (const result of failed) console.log(`  ${result.url}  (${result.coverageState})`)
}
if (jsonOut) {
  writeFileSync(jsonOut, `${JSON.stringify(results, null, 2)}\n`)
  console.log(`\nFull results: ${jsonOut}`)
}
if (stopError) {
  console.error(`\nStopped after ${results.length} of ${urls.length} URLs: ${stopError.message}`)
  process.exitCode = 1
} else if (failed.length > 0) {
  process.exitCode = 1
}
