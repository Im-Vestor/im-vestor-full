import { getAuth } from '@clerk/nextjs/server';
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { env } from '~/env.js';
import { db } from '~/server/db';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

interface Product {
  id: string;
  name: string;
  price: string;
  description: string;
  onlyEntrepreneur: boolean;
}

const products: Record<string, Product> = {
  poke: {
    id: 'poke',
    name: 'Poke',
    price: env.STRIPE_POKE_PRICE_ID,
    description:
      'Sends an introduction note to investors about your entrepreneur profile, helping you make that crucial first connection.',
    onlyEntrepreneur: true,
  },
  boost: {
    id: 'boost',
    name: 'Boost',
    price: env.STRIPE_BOOST_PRICE_ID,
    description:
      'Places your project at the top of business sector searches, increasing visibility to potential investors.',
    onlyEntrepreneur: true,
  },
  'pitch-of-the-week-ticket': {
    id: 'pitch-of-the-week-ticket',
    name: 'Public PitchTicket',
    price: env.STRIPE_DAILY_PITCH_TICKET_PRICE_ID,
    description:
      'Access to 2 public publick pitches open to all investors, hosted by our team, with optional Q&A session. Can be paid access or assigned to entrepreneur projects.',
    onlyEntrepreneur: false,
  },
  'hyper-train-ticket': {
    id: 'hyper-train-ticket',
    name: 'Hyper Train Ticket',
    price: env.STRIPE_HYPER_TRAIN_TICKET_PRICE_ID,
    description:
      "Makes your project appear in the investors' hyper train feed, exposing your venture to a targeted audience.",
    onlyEntrepreneur: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Stripe checkout API called with method:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = getAuth(req);
    console.log('User ID from auth:', userId);

    if (!userId) {
      console.log('No user ID found, returning 401');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        investor: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });

      customerId = customer.id;

      // Update user with Stripe customer ID
      await db.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const { productId, projectId } = req.body as {
      productId: string;
      projectId?: string;
    };

    console.log('Request body:', { productId, projectId });

    const product = products[productId];
    console.log('Found product:', product);

    if (!product) {
      console.log('Product not found for ID:', productId);
      return res.status(404).json({ message: 'Product not found' });
    }

    // Create Stripe checkout session
    console.log('Creating Stripe checkout session with:', {
      customer: customerId,
      price: product.price,
      productId: product.id,
      projectId
    });

    const redirectTo =
      productId === 'hyper-train-ticket'
        ? `${req.headers.origin}/projects/${projectId}/hypertrain`
        : `${req.headers.origin}/shop`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: product.price,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: redirectTo,
      cancel_url: `${req.headers.origin}/shop`,
      metadata: {
        userId: user.id,
        userType: user.userType,
        productType: product.id,
        projectId: projectId ?? null,
      },
    });

    console.log('Stripe session created:', { sessionId: session.id, url: session.url });

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
