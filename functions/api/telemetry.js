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

    // Placeholder for actual telemetry processing logic
    // For now, we'll just log it to the edge console and return a success response.
    const country = context.request.cf?.country || 'UNKNOWN';
    const colo = context.request.cf?.colo || 'EDGE';
    console.info(`[ TELEMETRY INGEST ] Node: ${colo} | Geo: ${country} | Mode: ${isBatch ? 'Batch' : 'Single'}`);

    return new Response(JSON.stringify({ status: 'ok', mode: 'edge-logged', processed: isBatch ? requestData.length : 1 }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error('[ TELEMETRY INGEST ERROR ]', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', message: 'Failed to parse telemetry payload' }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
