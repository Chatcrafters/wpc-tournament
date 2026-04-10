require('dotenv').config({ path: '.env.local' });
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();
app.use(express.json());

app.post('/api/create-checkout-session', async (req, res) => {
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

const PORT = 3001;
app.listen(PORT, () => console.log(`[API] Stripe server running on http://localhost:${PORT}`));
