require('dotenv').config({ path: '.env.local' });
const express = require('express');
const cors = require('cors');

const sk = process.env.STRIPE_SECRET_KEY;
if (!sk) {
  console.error('[API] ERROR: STRIPE_SECRET_KEY not found in .env.local');
  process.exit(1);
}
console.log('[API] Stripe key loaded:', sk.substring(0, 12) + '...');

const stripe = require('stripe')(sk);
const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/create-checkout-session', async (req, res) => {
  const { amount, registrationId, playerName } = req.body;
  console.log('[API] Received:', { amount, registrationId, playerName });

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
            description: 'Turnieranmeldung Vienna Pickleball Open',
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `http://localhost:5173?payment=success&session_id={CHECKOUT_SESSION_ID}&reg_id=${registrationId}`,
      cancel_url: `http://localhost:5173?payment=cancelled`,
      metadata: { registrationId, playerName: playerName || '' },
    });

    console.log('[Stripe] Session created:', session.id);
    res.json({ url: session.url });
  } catch (err) {
    console.error('[Stripe] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`[API] Stripe server running on http://localhost:${PORT}`);
  console.log('[API] Waiting for requests...');
});
