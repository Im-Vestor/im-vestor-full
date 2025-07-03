import { env } from '~/env.js';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '~/server/db';
import { waitUntil } from '@vercel/functions';

const allowedEvents: Stripe.Event.Type[] = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
  'customer.subscription.pending_update_applied',
  'customer.subscription.pending_update_expired',
  'customer.subscription.trial_will_end',
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.payment_action_required',
  'invoice.upcoming',
  'invoice.marked_uncollectible',
  'invoice.payment_succeeded',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_intent.canceled',
];

export async function POST(req: Request) {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-05-28.basil',
  });

  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature');

  if (!signature) return NextResponse.json({}, { status: 400 });

  async function doEventProcessing() {
    if (typeof signature !== 'string') {
      throw new Error("[STRIPE HOOK] Header isn't a string???");
    }

    const event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);

    waitUntil(processEvent(event));
  }

  try {
    await doEventProcessing();
  } catch (error) {
    console.error('[STRIPE HOOK] Error processing event', error);
  }

  return NextResponse.json({ received: true });
}

async function processEvent(event: Stripe.Event) {
  // Skip processing if the event isn't one I'm tracking (list of all events below)
  if (!allowedEvents.includes(event.type)) return;

  console.log('event', event);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const userId = session.metadata?.userId;
    const productType = session.metadata?.productType;

    if (userId && productType === 'poke') {
      // Increment user's available pokes
      await db.user.update({
        where: { id: userId },
        data: {
          availablePokes: {
            increment: 1,
          },
        },
      });

      console.log(`Added 1 poke to user ${userId}`);
    }

    if (userId && productType === 'boost') {
      // Increment user's available boosts
      await db.user.update({
        where: { id: userId },
        data: {
          availableBoosts: {
            increment: 1,
          },
        },
      });
    }
  }
}
