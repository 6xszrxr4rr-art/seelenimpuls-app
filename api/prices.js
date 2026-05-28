module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://seelenimpuls.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  res.json({
    aboMonthly: {
      id:       process.env.STRIPE_PRICE_ABO_MONTHLY,
      amount:   499,
      currency: 'eur',
      interval: 'month',
    },
    aboYearly: {
      id:       process.env.STRIPE_PRICE_ABO_YEARLY,
      amount:   3999,
      currency: 'eur',
      interval: 'year',
    },
    songSingle: null,
    songDeAll:  null,
    songEnAll:  null,
  });
};
