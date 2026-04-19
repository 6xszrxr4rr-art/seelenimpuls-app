const Stripe = require('stripe');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://seelenimpuls.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const { priceId, mode, email } = req.body;

  if (!priceId || !mode) return res.status(400).json({ error: 'Missing priceId or mode' });

  const session = await stripe.checkout.sessions.create({
    mode,
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email || undefined,
    success_url: `https://seelenimpuls.app/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `https://seelenimpuls.app/?payment=cancelled`,
    allow_promotion_codes: true,
  });

  res.json({ url: session.url });
};
