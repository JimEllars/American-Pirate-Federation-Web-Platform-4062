import { jsonResponse, preflight, apiError } from './_cors.js';
import { rateLimit, clientIp } from './_ratelimit.js';

/**
 * POST /api/ai — internal AI gateway proxy.
 *
 * This handler previously returned a hardcoded `{"message":"AI Proxy placeholder"}` with
 * HTTP 200. Every caller therefore believed it had received a model completion, and the
 * SOP's stated contract (IP rate limiting, prompts grounded in the Pirate Code) was not
 * implemented at all. It is now either a working proxy or an honest 503.
 *
 * Architectural Law 3: AI_API_SECRET is read from `env` and used server-to-server only.
 */

const MAX_PROMPT_CHARS = 4000;
const MAX_MESSAGES = 12;

/**
 * The Twenty Articles, in doctrinal order (APF Master Strategy Plan §3).
 * This is the complete permitted knowledge base for the assistant: it must not answer
 * from general political knowledge, only from Federation doctrine.
 */
const PIRATE_CODE = [
  ['I', 'Every Pirate Matters', 'Unity & equity; 14th Amendment equal protection'],
  ['II', 'No Quarter for Corruption', 'Emoluments Clause; overturn Citizens United'],
  ['III', 'Health of the Crew', 'Mutual aid healthcare; Preamble general welfare'],
  ['IV', 'A Fair Share of the Plunder', 'Economic equity; 16th Amendment, progressive wages'],
  ['V', 'Hoist the Sails for Knowledge', 'Open source; 1st Amendment press freedom'],
  ['VI', 'No Pirate Left Behind', 'Safety net; Preamble general welfare'],
  ['VII', "A Pirate's Right to Privacy", 'Data sovereignty; 4th Amendment'],
  ['VIII', 'No Taxation Without Representation', 'Economic autonomy; Article I §8'],
  ['IX', 'Free Speech & Open Frequencies', 'Expression; 1st Amendment, whistleblower protection'],
  ['X', 'Freedom of Religion', 'Liberty of belief; establishment and free exercise clauses'],
  ['XI', 'The Right to Shelter', 'Housing; 9th Amendment'],
  ['XII', 'Sovereign Sustenance', 'Clean water and food as a right'],
  ['XIII', 'Innovation Beyond Extraction', 'Decentralized renewable microgrids'],
  ['XIV', 'Equitable Contribution', 'Restoration of 1950s top marginal tax brackets'],
  ['XV', 'The Strength of the Union', 'Collective bargaining; anti-union-busting'],
  ['XVI', 'Liberation Through Learning', 'Tuition-free public universities; debt relief'],
  ['XVII', 'Temporal Limits of Authority', 'Term limits across branches'],
  ['XVIII', 'Generational Stewardship', 'Age ceilings for federal servants'],
  ['XIX', 'Local Infrastructure Consent', 'Local referendums for data centres and heavy industry'],
  ['XX', 'Subversion of Corporate Dominance', 'Abolition of corporate personhood; executive liability']
];

const SYSTEM_PROMPT = [
  'You are the American Pirate Federation intelligence officer.',
  'Answer ONLY from The Pirate Code below. If a question falls outside it, say plainly that',
  'the Federation has no adopted position and suggest which Article would need amending.',
  'You have no authority to move funds: never propose, confirm, or narrate a treasury',
  'transfer, and never emit machine-readable action blocks for financial operations.',
  'Be concise, plain-spoken, and cite Articles as "Article VII" style.',
  '',
  'THE TWENTY ARTICLES OF THE PIRATE CODE:',
  ...PIRATE_CODE.map(([num, title, focus]) => `Article ${num} — ${title}: ${focus}.`)
].join('\n');

const articleNumbers = new Set(PIRATE_CODE.map(([num]) => num));

const citedArticles = (text) => {
  if (typeof text !== 'string') return [];
  const found = new Set();
  const pattern = /Article\s+([IVX]{1,5})\b/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    if (articleNumbers.has(match[1])) found.add(match[1]);
  }
  return [...found];
};

export async function onRequestOptions(context) {
  return preflight(context.request) ?? new Response(null, { status: 204 });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const limit = rateLimit(`ai:${clientIp(request)}`, { limit: 20, windowMs: 600000 });
  if (!limit.allowed) {
    return jsonResponse(
      { status: 'error', message: 'Rate limit reached. Try again shortly.' },
      429,
      request
    );
  }

  const gatewayUrl = env.AI_GATEWAY_URL;
  const gatewaySecret = env.AI_API_SECRET;
  if (!gatewayUrl || !gatewaySecret) {
    console.warn('[ AI ] Gateway is not configured (AI_GATEWAY_URL / AI_API_SECRET unset).');
    return apiError('The intelligence uplink is not configured.', 503, request);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return apiError('Request body must be valid JSON.', 400, request);
  }

  // Accept either a single prompt or a short conversation history.
  let incoming = [];
  if (typeof payload?.prompt === 'string') {
    incoming = [{ role: 'user', content: payload.prompt }];
  } else if (Array.isArray(payload?.messages)) {
    incoming = payload.messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-MAX_MESSAGES)
      .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_PROMPT_CHARS) }));
  }

  if (incoming.length === 0) {
    return apiError('Provide either a "prompt" string or a "messages" array.', 400, request);
  }

  const totalChars = incoming.reduce((sum, m) => sum + m.content.length, 0);
  if (totalChars > MAX_PROMPT_CHARS * MAX_MESSAGES) {
    return apiError('Conversation exceeds the permitted length.', 413, request);
  }

  const upstreamBody = {
    model: env.AI_MODEL || 'default',
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...incoming],
    max_tokens: 600,
    temperature: 0.2
  };

  let upstream;
  try {
    upstream = await fetch(gatewayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${gatewaySecret}`
      },
      body: JSON.stringify(upstreamBody),
      signal: AbortSignal.timeout(20000)
    });
  } catch (err) {
    console.error('[ AI ] Gateway unreachable.', err?.message);
    return apiError('The intelligence uplink did not respond.', 502, request);
  }

  const data = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    console.error('[ AI ] Gateway returned an error.', {
      status: upstream.status,
      message: data?.error?.message || data?.message
    });
    return apiError('The intelligence uplink returned an error.', 502, request);
  }

  const message = data?.choices?.[0]?.message?.content ?? data?.message ?? null;

  if (typeof message !== 'string' || message.trim() === '') {
    return apiError('The intelligence uplink returned no content.', 502, request);
  }

  return jsonResponse(
    {
      status: 'success',
      message,
      citations: citedArticles(message),
      grounding: 'The Twenty Articles of the Pirate Code'
    },
    200,
    request
  );
}
