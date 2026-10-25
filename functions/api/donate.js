export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { amount, frequency, email, name } = await request.json();

    // Validate amount
    const parsedAmount = parseInt(amount, 10);
    if (!parsedAmount || parsedAmount < 500) { // Minimum $5.00
      return new Response(JSON.stringify({ error: 'Minimum donation is $5.00' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const stripeKey = env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'Stripe configuration pending' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Call Stripe API server-to-server
    const params = new URLSearchParams();
    params.append('amount', parsedAmount.toString());
    params.append('currency', 'usd');
    params.append('payment_method_types[]', 'card');
    params.append('metadata[organization]', 'APF Action');
    params.append('metadata[tax_deductible]', 'false');
    if (email) params.append('receipt_email', email);

    const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const session = await stripeRes.json();
    return new Response(JSON.stringify({ clientSecret: session.client_secret, id: session.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
