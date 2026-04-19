async function redisGet(key) {
  const r = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(['GET', key]),
  });
  const data = await r.json();
  return data.result ? JSON.parse(data.result) : null;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://seelenimpuls.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Verify by session_id (after payment redirect)
  const { session_id, email } = req.query;

  if (session_id) {
    const sessionData = await redisGet(`session:${session_id}`);
    if (!sessionData) return res.json({ valid: false });

    const e = sessionData.email;
    const sub = await redisGet(`sub:${e}`);
    const hasSubscription = !!(sub && sub.active);

    // Collect all purchases for this email
    // We return the stored session info + subscription status
    return res.json({
      valid: true,
      email: e,
      mode: sessionData.mode,
      hasSubscription,
    });
  }

  if (email) {
    const e = email.toLowerCase();
    const sub = await redisGet(`sub:${e}`);
    const hasSubscription = !!(sub && sub.active);
    return res.json({ valid: true, email: e, hasSubscription });
  }

  res.status(400).json({ error: 'Missing session_id or email' });
};
