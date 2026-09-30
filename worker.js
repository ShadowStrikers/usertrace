// UserTrace CORS proxy — Cloudflare Worker
//
// Deploy: dash.cloudflare.com → Workers & Pages → Create → paste this file → Deploy.
// Then copy the assigned *.workers.dev URL into PROXY_BASE in index.html.
//
// Usage: GET <this-worker-url>/?url=<encoded target url>
// Returns an empty body carrying only the target's real HTTP status code,
// with CORS headers so the browser can read it cross-origin.

const UPSTREAM_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Cache-Control': 'no-store',
};

async function fetchStatus(targetUrl, signal) {
  let resp = await fetch(targetUrl, {
    method: 'HEAD',
    redirect: 'manual',
    signal,
    headers: UPSTREAM_HEADERS,
  });
  // Some sites reject HEAD outright — fall back to GET for those.
  if (resp.status === 405 || resp.status === 501) {
    resp = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'manual',
      signal,
      headers: UPSTREAM_HEADERS,
    });
  }
  return resp;
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const reqUrl = new URL(request.url);
    const target = reqUrl.searchParams.get('url');
    if (!target) {
      return new Response('Missing url parameter', { status: 400, headers: CORS_HEADERS });
    }

    let targetUrl;
    try {
      targetUrl = new URL(target);
    } catch {
      return new Response('Invalid url parameter', { status: 400, headers: CORS_HEADERS });
    }
    if (targetUrl.protocol !== 'https:' && targetUrl.protocol !== 'http:') {
      return new Response('Unsupported protocol', { status: 400, headers: CORS_HEADERS });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    try {
      const resp = await fetchStatus(targetUrl.toString(), controller.signal);
      return new Response(null, { status: resp.status, headers: CORS_HEADERS });
    } catch {
      return new Response(null, { status: 502, headers: CORS_HEADERS });
    } finally {
      clearTimeout(timer);
    }
  },
};
