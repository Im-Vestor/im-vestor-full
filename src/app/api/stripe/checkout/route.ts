import { getAuth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { env } from '~/env.js';
import { db } from '~/server/db';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

export const products = [
  {
    id: 'poke',
    name: 'Poke',
    price: env.STRIPE_POKE_PRICE_ID,
    description:
      'Sends an introduction note to investors about your entrepreneur profile, helping you make that crucial first connection.',
    onlyEntrepreneur: true,
  },
  {
    id: 'boost',
    name: 'Boost',
    price: env.STRIPE_BOOST_PRICE_ID,
    description:
      'Places your project at the top of business sector searches, increasing visibility to potential investors.',
    onlyEntrepreneur: true,
  },
  {
    id: 'daily-pitch-ticket',
    name: 'Daily Pitch Ticket',
    price: env.STRIPE_DAILY_PITCH_TICKET_PRICE_ID,
    description:
      'Access to 2 public daily pitches open to all investors, hosted by our team, with optional Q&A session. Can be paid access or assigned to entrepreneur projects.',
    onlyEntrepreneur: false,
  },
  {
    id: 'hyper-train-ticket',
    name: 'Hyper Train Ticket',
    price: env.STRIPE_HYPER_TRAIN_TICKET_PRICE_ID,
    description:
      "Makes your project appear in the investors' hyper train feed, exposing your venture to a targeted audience.",
    onlyEntrepreneur: false,
  },
];

export async function POST(req: Request) {
  try {
    const { userId } = getAuth(req as NextRequest);

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
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

    const { productId } = (await req.json()) as { productId: string };

    const product = products.find(p => p.id === productId);

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Create Stripe checkout session
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
      success_url: `${req.headers.get('origin')}/shop`,
      cancel_url: `${req.headers.get('origin')}/shop`,
      metadata: {
        userId: user.id,
        productType: product.id,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
