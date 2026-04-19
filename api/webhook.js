const Stripe = require('stripe');

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function redisSet(key, value) {
  const r = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(['SET', key, JSON.stringify(value)]),
  });
  return r.json();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = (session.customer_email || session.customer_details?.email || '').toLowerCase();
    if (!email) return res.json({ received: true });

    await redisSet(`session:${session.id}`, { email, mode: session.mode, ts: Date.now() });

    if (session.mode === 'subscription') {
      await redisSet(`sub:${email}`, {
        active: true,
        customerId: session.customer,
        subscriptionId: session.subscription,
        ts: Date.now(),
      });
    } else {
      const items = await stripe.checkout.sessions.listLineItems(session.id);
      for (const item of items.data) {
        await redisSet(`purchase:${email}:${item.price.id}`, { ts: Date.now(), sessionId: session.id });
      }
    }
  }

  if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
    const sub = event.data.object;
    const customer = await stripe.customers.retrieve(sub.customer);
    const email = (customer.email || '').toLowerCase();
    if (email) {
      await redisSet(`sub:${email}`, {
        active: sub.status === 'active',
        customerId: sub.customer,
        subscriptionId: sub.id,
        ts: Date.now(),
      });
    }
  }

  res.json({ received: true });
};

module.exports.config = { api: { bodyParser: false } };
