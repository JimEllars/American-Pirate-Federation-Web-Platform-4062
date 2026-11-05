import { jsonResponse, preflight, apiError } from './_cors.js';
import { rateLimit, clientIp } from './_ratelimit.js';

/**
 * POST /api/subscribe — newsletter intake, dispatched server-to-server to Emailit.
 *
 * Architectural Law 3: EMAILIT_API_KEY stays in the Pages environment.
 *
 * Fixed here: when EMAILIT_API_KEY was unset this handler returned HTTP 200
 * `{"status":"queued","message":"Subscription recorded"}` while storing nothing. A
 * subscriber saw "SUBSCRIPTION CONFIRMED", the address was dropped, and the edge log
 * showed success. Silent data loss presented as success is the exact failure mode Law 1
 * exists to prevent, so an unconfigured provider is now a 503 the UI can report honestly.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function onRequestOptions(context) {
  return preflight(context.request) ?? new Response(null, { status: 204 });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const limit = rateLimit(`subscribe:${clientIp(request)}`, { limit: 5, windowMs: 600000 });
  if (!limit.allowed) {
    return jsonResponse(
      { status: 'error', message: 'Too many subscription attempts. Try again later.' },
      429,
      request
    );
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return apiError('Request body must be valid JSON.', 400, request);
  }

  const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';

  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return apiError('A valid email address is required.', 400, request);
  }

  const apiKey = env.EMAILIT_API_KEY;
  if (!apiKey) {
    console.warn('[ SUBSCRIBE ] EMAILIT_API_KEY is not configured — refusing to fake success.');
    return jsonResponse(
      {
        status: 'error',
        message: 'The intelligence feed is not accepting subscriptions right now.'
      },
      503,
      request
    );
  }

  let upstream;
  try {
    upstream = await fetch('https://api.emailit.com/v1/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({ email })
    });
  } catch (err) {
    console.error('[ SUBSCRIBE ] Emailit unreachable.', err?.message);
    return jsonResponse(
      { status: 'error', message: 'Could not reach the mailing service. Please try again.' },
      502,
      request
    );
  }

  // 409 = already subscribed. That is a success from the subscriber's point of view.
  if (upstream.ok || upstream.status === 409) {
    return jsonResponse({ status: 'success' }, 200, request);
  }

  const detail = await upstream.json().catch(() => null);
  console.error('[ SUBSCRIBE ] Emailit rejected the subscriber.', {
    status: upstream.status,
    message: detail?.message
  });

  return jsonResponse(
    { status: 'error', message: 'The mailing service rejected this subscription.' },
    502,
    request
  );
}
