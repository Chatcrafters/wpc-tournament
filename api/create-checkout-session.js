import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { amount, registrationId, playerName } = req.body;

  if (!amount || !registrationId) {
    return res.status(400).json({ error: 'Missing amount or registrationId' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `PicklePass Startgeld – ${playerName || 'Spieler'}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin}?payment=success&session_id={CHECKOUT_SESSION_ID}&reg_id=${registrationId}`,
      cancel_url: `${req.headers.origin}?payment=cancelled`,
      metadata: { registrationId, playerName: playerName || '' },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[Stripe] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
