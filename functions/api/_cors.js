/**
 * Shared CORS + response helpers for Cloudflare Pages Functions.
 *
 * Files and directories beginning with `_` are not routed by Pages Functions, so this
 * module is import-only.
 *
 * SOP §7 "CORS Block on /api/*": edge functions must echo an allowlisted Origin rather
 * than emitting `Access-Control-Allow-Origin: *`. The previous wildcard on both
 * `public/_headers` and each handler let any third-party origin drive these endpoints
 * (notably /api/donate, which had no auth or rate limit).
 */

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/([a-z0-9-]+\.)*pirateusa\.org$/i,
  /^https:\/\/([a-z0-9-]+\.)*piratefederation\.org$/i,
  // Cloudflare Pages preview deployments for this project
  /^https:\/\/[a-z0-9-]+\.american-pirate-federation-web-platform-4062\.pages\.dev$/i,
  /^http:\/\/localhost:(5173|8788)$/i,
  /^http:\/\/127\.0\.0\.1:(5173|8788)$/i
];

export const isAllowedOrigin = (origin) => {
  if (!origin) return false;
  return ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
};

export const corsHeaders = (request) => {
  const origin = request.headers.get('Origin');
  if (!isAllowedOrigin(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, cf-device-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
};

export const jsonResponse = (body, status, request) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...corsHeaders(request)
    }
  });

export const preflight = (request) => {
  if (request.method !== 'OPTIONS') return null;
  const headers = corsHeaders(request);
  // An origin we do not recognise still gets a 204, but without the allow headers, so
  // the browser refuses to hand the response to the caller.
  return new Response(null, { status: 204, headers });
};

/**
 * Naming convention for the API envelope, per SOP §4 Playbook B.
 */
export const apiError = (message, status = 400, request = null) =>
  jsonResponse({ status: 'error', message }, status, request);
