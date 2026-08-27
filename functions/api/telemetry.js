export async function onRequest(context) {
  // Handle CORS preflight
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, cf-device-type",
      },
    });
  }

  // Check payload size
  const contentLength = context.request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 16384) {
    return new Response(JSON.stringify({ error: 'Payload Too Large', message: 'Payload size exceeds 16KB limit' }), {
      status: 413,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const requestData = await context.request.json();
    const isBatch = Array.isArray(requestData);
    let events = isBatch ? requestData : [requestData];

    if (events.length > 50) {
      return new Response(JSON.stringify({ error: 'Payload Too Large', message: 'Batch size exceeds 50 events limit' }), {
        status: 413,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
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

    // Placeholder for actual telemetry processing logic
    // For now, we'll just log it to the edge console and return a success response.
    const country = context.request.cf?.country || 'UNKNOWN';
    const colo = context.request.cf?.colo || 'EDGE';
    console.info(`[ TELEMETRY INGEST ] Node: ${colo} | Geo: ${country} | Mode: ${isBatch ? 'Batch' : 'Single'} | Count: ${events.length}`);

    return new Response(JSON.stringify({ status: 'ok', mode: 'edge-logged', processed: events.length }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error('[ TELEMETRY INGEST ERROR ]', error.message);
    return new Response(JSON.stringify({ error: 'Bad Request', message: error.message || 'Failed to parse telemetry payload' }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    });
  }
}
