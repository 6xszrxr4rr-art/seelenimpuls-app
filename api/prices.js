const Stripe = require('stripe');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://seelenimpuls.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  const ids = {
    aboMonthly: process.env.STRIPE_PRICE_ABO_MONTHLY,
    aboYearly:  process.env.STRIPE_PRICE_ABO_YEARLY,
    songSingle: process.env.STRIPE_PRICE_SONG_SINGLE,
    songDeAll:  process.env.STRIPE_PRICE_SONG_DE_ALL,
    songEnAll:  process.env.STRIPE_PRICE_SONG_EN_ALL,
  };

  try {
    const entries = await Promise.all(
      Object.entries(ids).map(async ([key, id]) => {
        if (!id) return [key, null];
        const price = await stripe.prices.retrieve(id);
        return [key, {
          id,
          amount:   price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval || null,
        }];
      })
    );
    res.json(Object.fromEntries(entries));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
