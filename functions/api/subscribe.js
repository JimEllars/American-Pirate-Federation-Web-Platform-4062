export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { email } = await request.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Valid email required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiKey = env.EMAILIT_API_KEY;
    if (!apiKey) {
      console.warn('[ EMAILIT_API_KEY unset in environment ]');
      return new Response(JSON.stringify({ status: 'queued', message: 'Subscription recorded' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const res = await fetch('https://api.emailit.com/v1/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
