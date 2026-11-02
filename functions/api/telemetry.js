import { jsonResponse, preflight } from './_cors.js';

export async function onRequest(context) {
  // Handle CORS preflight. Origin is echoed from an allowlist rather than "*".
  const corsPreflight = preflight(context.request);
  if (corsPreflight) return corsPreflight;

  // POST-only ingress. Without this guard a GET or PUT fell through to the JSON parse and
  // was reported as a malformed payload rather than an unsupported method.
  if (context.request.method !== 'POST') {
    return jsonResponse(
      { status: 'error', message: 'Method not allowed. Telemetry ingress is POST-only.' },
      405,
      context.request
    );
  }

  // Check payload size
  const contentLength = context.request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 16384) {
    return jsonResponse({ status: 'error', message: 'Payload size exceeds the 16 KB limit.' }, 413, context.request);
  }

  try {
    const requestData = await context.request.json();
    const isBatch = Array.isArray(requestData);
    let events = isBatch ? requestData : [requestData];

    if (events.length > 50) {
      return jsonResponse({ status: 'error', message: 'Batch size exceeds the 50 event limit.' }, 413, context.request);
    }

    // Basic schema validation
    for (const evt of events) {
      if (typeof evt !== 'object' || evt === null) {
        throw new Error('Invalid event payload: must be an object');
      }

      // Schema check on event name, payload size < 16KB, timestamp sanity check
      const now = Date.now();
      const hasStrictSchema = (
          typeof evt.event === 'string' &&
          evt.event.length > 0 &&
          evt.event.length <= 100 &&
          typeof evt.timestamp === 'number' &&
          evt.timestamp <= now + 86400000 && // Not more than 1 day in the future
          evt.timestamp >= now - 7200000 && // Not more than 2 hours in the past
          typeof evt.metadata === 'object' &&
          evt.metadata !== null
      );

      // If the payload does not match the strict schema, reject it.
      if (!hasStrictSchema) {
        throw new Error('Invalid schema. Expected { event: string, timestamp: number, metadata: object } and timestamp within 2 hours of current time.');
      }
    }

    // NOTE: events are validated and geo-tagged at the edge, then written to the edge log
    // only. There is no durable sink yet (no KV/D1/Logpush binding in wrangler.toml), so
    // this endpoint is a validated ingress, not a store. The client must not treat a 200
    // here as "analytics recorded" in any user-facing copy.
    const country = context.request.cf?.country || 'UNKNOWN';
    const colo = context.request.cf?.colo || 'EDGE';
    console.info(`[ TELEMETRY INGEST ] Node: ${colo} | Geo: ${country} | Mode: ${isBatch ? 'Batch' : 'Single'} | Count: ${events.length}`);

    return jsonResponse({ status: 'ok', mode: 'edge-logged', processed: events.length }, 200, context.request);
  } catch (error) {
    console.error('[ TELEMETRY INGEST ERROR ]', error.message);
    return jsonResponse(
      { status: 'error', message: error.message || 'Failed to parse telemetry payload' },
      400,
      context.request
    );
  }
}
