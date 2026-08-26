export async function onRequest(context) {
  // Handle CORS preflight
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
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

      const hasStrictSchema = (typeof evt.event === 'string' && typeof evt.timestamp === 'number' && typeof evt.metadata === 'object' && evt.metadata !== null);

      // If the payload does not match the strict schema, reject it.
      if (!hasStrictSchema) {
        throw new Error('Invalid schema. Expected { event: string, timestamp: number, metadata: object }');
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
      },
    });
  } catch (error) {
    console.error('[ TELEMETRY INGEST ERROR ]', error.message);
    return new Response(JSON.stringify({ error: 'Bad Request', message: error.message || 'Failed to parse telemetry payload' }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
