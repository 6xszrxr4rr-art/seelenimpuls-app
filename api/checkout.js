const Stripe = require('stripe');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://seelenimpuls.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { priceId, mode, email } = req.body;
  if (!priceId || !mode) return res.status(400).json({ error: 'Missing priceId or mode' });

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      maxNetworkRetries: 0,
      timeout: 8000,
    });

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email || undefined,
      success_url: `https://seelenimpuls.app/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://seelenimpuls.app/?payment=cancelled`,
      allow_promotion_codes: true,
    });

    res.json({ url: session.url });
  } catch (e) {
    console.error('Stripe checkout error:', e.type, e.message);
    res.status(500).json({ error: e.message, type: e.type });
  }
};
