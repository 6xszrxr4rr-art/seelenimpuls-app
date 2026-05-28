module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://seelenimpuls.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { priceId, mode, email } = req.body;
  if (!priceId || !mode) return res.status(400).json({ error: 'Missing priceId or mode' });

  try {
    const params = new URLSearchParams({
      mode,
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      success_url: 'https://seelenimpuls.app/?payment=success&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://seelenimpuls.app/?payment=cancelled',
      allow_promotion_codes: 'true',
    });
    if (email) params.append('customer_email', email);

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await stripeRes.json();
    if (!stripeRes.ok) return res.status(stripeRes.status).json({ error: data.error?.message || 'Stripe error' });
    res.json({ url: data.url });
  } catch (e) {
    console.error('checkout error:', e.message);
    res.status(500).json({ error: e.message });
  }
};
