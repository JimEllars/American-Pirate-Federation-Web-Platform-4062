import { jsonResponse, preflight, apiError } from './_cors.js';
import { rateLimit, clientIp } from './_ratelimit.js';

/**
 * POST /api/donate — APF Action card contributions (501(c)(4)).
 *
 * Architectural Law 2 (Sidecar Model Separation): card money goes to APF Action only.
 * Architectural Law 3 (Zero-Secret Edge Containment): STRIPE_SECRET_KEY is read from
 *   `env` inside the edge function and never reaches the client bundle.
 *
 * Changes in this revision:
 *  - `frequency` is honoured. It was previously accepted and discarded, so a donor who
 *    chose "Monthly" was silently charged once. Both modes now go through a Stripe
 *    Checkout Session (`mode=payment` / `mode=subscription`), which keeps card entry on
 *    Stripe's domain and gives recurring donations a real subscription object.
 *  - Per-IP rate limit, so the endpoint cannot be used to mass-create sessions
 *    (card-testing / account-flagging risk).
 *  - Hard upper bound on amount.
 */

const MIN_AMOUNT_CENTS = 500; // SOP §4 Playbook B: hard $5.00 floor
const MAX_AMOUNT_CENTS = 1000000; // $10,000.00 ceiling per single contribution
const ALLOWED_FREQUENCIES = new Set(['monthly', 'one-time']);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function onRequestOptions(context) {
  return preflight(context.request) ?? new Response(null, { status: 204 });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const limit = rateLimit(`donate:${clientIp(request)}`, { limit: 10, windowMs: 300000 });
  if (!limit.allowed) {
    return jsonResponse(
      {
        status: 'error',
        message: 'Too many donation attempts. Please wait a few minutes and try again.'
      },
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

  const { amount, frequency = 'one-time', email } = payload ?? {};

  // ---- amount -------------------------------------------------------------
  const parsedAmount = Number(amount);
  if (!Number.isInteger(parsedAmount) || parsedAmount < MIN_AMOUNT_CENTS) {
    return apiError('Minimum donation is $5.00.', 400, request);
  }
  if (parsedAmount > MAX_AMOUNT_CENTS) {
    return apiError(
      'Maximum single contribution is $10,000.00. For larger gifts please contact the Quartermaster.',
      400,
      request
    );
  }

  // ---- frequency ----------------------------------------------------------
  if (!ALLOWED_FREQUENCIES.has(frequency)) {
    return apiError("frequency must be either 'monthly' or 'one-time'.", 400, request);
  }

  // ---- optional receipt email --------------------------------------------
  let receiptEmail = null;
  if (email !== undefined && email !== null && email !== '') {
    if (typeof email !== 'string' || !EMAIL_PATTERN.test(email)) {
      return apiError('A valid email address is required for a receipt.', 400, request);
    }
    receiptEmail = email.trim().toLowerCase();
  }

  const stripeKey = env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    // Fail loudly and honestly: no fake success, no client-side fallback.
    console.warn('[ DONATE ] STRIPE_SECRET_KEY is not configured in the Pages environment.');
    return apiError('Card contributions are not configured yet.', 503, request);
  }

  const siteUrl = (env.SITE_URL || 'https://pirateusa.org').replace(/\/+$/, '');
  const isRecurring = frequency === 'monthly';
  const amountLabel = `$${(parsedAmount / 100).toFixed(2)}`;

  // ---- Stripe Checkout Session -------------------------------------------
  const params = new URLSearchParams();
  params.append('mode', isRecurring ? 'subscription' : 'payment');
  params.append('success_url', `${siteUrl}/donate?status=success`);
  params.append('cancel_url', `${siteUrl}/donate?status=cancelled`);
  params.append('line_items[0][quantity]', '1');
  params.append('line_items[0][price_data][currency]', 'usd');
  params.append('line_items[0][price_data][unit_amount]', String(parsedAmount));
  params.append(
    'line_items[0][price_data][product_data][name]',
    isRecurring ? `APF Action — Monthly ${amountLabel}` : `APF Action — One-time ${amountLabel}`
  );
  if (isRecurring) {
    params.append('line_items[0][price_data][recurring][interval]', 'month');
  }
  if (receiptEmail) {
    params.append('customer_email', receiptEmail);
  }

  // Statutory metadata of record. Applied to the session and, for subscriptions, to the
  // subscription object itself so downstream reporting cannot lose the 501(c)(4) flag.
  params.append('metadata[organization]', 'APF Action');
  params.append('metadata[tax_deductible]', 'false');
  params.append('metadata[frequency]', frequency);
  if (isRecurring) {
    params.append('subscription_data[metadata][organization]', 'APF Action');
    params.append('subscription_data[metadata][tax_deductible]', 'false');
  }

  let stripeRes;
  try {
    stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        // Stripe recommends idempotency keys on create calls; the client supplies one
        // per submit so a double-tap cannot open two subscriptions.
        'Idempotency-Key':
          request.headers.get('Idempotency-Key') || `apf-${clientIp(request)}-${parsedAmount}-${frequency}-${Math.floor(Date.now() / 60000)}`
      },
      body: params.toString()
    });
  } catch (err) {
    console.error('[ DONATE ] Stripe request failed at the network layer.', err?.message);
    return apiError('Could not reach the payment processor. Please try again.', 502, request);
  }

  const session = await stripeRes.json().catch(() => null);

  if (!stripeRes.ok || !session?.url) {
    console.error('[ DONATE ] Stripe rejected the session.', {
      status: stripeRes.status,
      type: session?.error?.type,
      message: session?.error?.message
    });
    return apiError('The payment processor declined to open a checkout session.', 502, request);
  }

  return jsonResponse(
    {
      status: 'success',
      id: session.id,
      frequency,
      amountCents: parsedAmount,
      checkoutUrl: session.url,
      // Echoed for the UI's own reassurance; the authoritative copy lives on the session.
      disclosure: 'Contributions to APF Action are not deductible as charitable contributions for federal income tax purposes.'
    },
    200,
    request
  );
}
