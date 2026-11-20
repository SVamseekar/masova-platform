// Runs only for /assets/* (see run_worker_first in wrangler.jsonc).
// The SPA fallback would otherwise answer a missing hashed chunk with index.html,
// which _headers then marks immutable for a year. Return a real 404 instead.
export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request)
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('text/html')) {
      return new Response('Not found', {
        status: 404,
        headers: { 'Cache-Control': 'no-store' },
      })
    }
    return response
  },
}
