// API route for handling successful payments
// This can be deployed as a Vercel API route or Netlify function

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Handle GET request for session retrieval
    const { session_id } = req.query;
    
    if (!session_id) {
      res.status(400).json({ error: 'Missing session_id parameter' });
      return;
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(session_id as string);
      
      res.status(200).json({
        session: {
          id: session.id,
          payment_status: session.payment_status,
          customer_details: session.customer_details,
          metadata: session.metadata,
        }
      });
    } catch (error) {
      console.error('Error retrieving session:', error);
      res.status(500).json({
        error: 'Failed to retrieve session',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: 'Missing session ID' });
      return;
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      res.status(400).json({ error: 'Payment not completed' });
      return;
    }

    // The actual credit addition should be handled by the webhook
    // This endpoint is mainly for client-side confirmation
    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      session: {
        id: session.id,
        payment_status: session.payment_status,
        customer_details: session.customer_details,
        metadata: session.metadata,
      }
    });

  } catch (error) {
    console.error('Error processing payment success:', error);
    res.status(500).json({
      error: 'Failed to process payment success',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}