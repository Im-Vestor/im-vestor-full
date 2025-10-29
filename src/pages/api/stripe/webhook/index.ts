import { env } from '~/env.js';
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { db } from '~/server/db';
import { addDays } from 'date-fns';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-05-28.basil',
  });

  const body = req.body as string;
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    return res.status(400).json({ message: 'Missing stripe signature' });
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);

    // Process event asynchronously
    void processEvent(event);

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[STRIPE HOOK] Error processing event', error);
    return res.status(400).json({ message: 'Webhook error' });
  }
}

async function processEvent(event: Stripe.Event) {
  // Skip processing if the event isn't one I'm tracking (list of all events below)
  if (!allowedEvents.includes(event.type)) return;

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const userId = session.metadata?.userId;
    const userType = session.metadata?.userType;
    const productType = session.metadata?.productType;
    const projectId = session.metadata?.projectId;

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

    if (userId && productType === 'hyper-train-ticket') {
      if (userType === 'INVESTOR') {
        const user = await db.user.findUnique({
          where: { id: userId },
          include: {
            investor: true,
          },
        });

        // Create a new hypertrain item
        await db.hyperTrainItem.create({
          data: {
            externalId: String(user?.investor?.id),
            type: 'INVESTOR',
            name: `${user?.investor?.firstName} ${user?.investor?.lastName}`,
            link: `/investor/${user?.investor?.id}`,
            liveUntil: addDays(new Date(), 7),
          },
        });
      }

      if (userType === 'VC_GROUP') {
        const user = await db.user.findUnique({
          where: { id: userId },
          include: {
            vcGroup: true,
          },
        });

        // Create a new hypertrain item
        await db.hyperTrainItem.create({
          data: {
            externalId: String(user?.vcGroup?.id),
            type: 'INVESTOR',
            name: `${user?.vcGroup?.name}`,
            link: `/vc-group/${user?.vcGroup?.id}`,
            liveUntil: addDays(new Date(), 7),
          },
        });
      }

      if (userType === 'ENTREPRENEUR') {
        const project = await db.project.findUnique({
          where: { id: projectId },
        });

        // Create a new hypertrain item
        await db.hyperTrainItem.create({
          data: {
            externalId: String(project?.id),
            type: 'PROJECT',
            name: project?.name ?? 'Untitled Project',
            link: `/projects/${project?.id}`,
            liveUntil: addDays(new Date(), 7),
          },
        });
      }

      if (userType === 'INCUBATOR') {
        const user = await db.user.findUnique({
          where: { id: userId },
          include: {
            incubator: true,
          },
        });

        await db.hyperTrainItem.create({
          data: {
            externalId: String(user?.incubator?.id),
            type: 'INVESTOR',
            name: user?.incubator?.name ?? 'Incubator',
            link: `/incubator/${user?.incubator?.id}`,
            liveUntil: addDays(new Date(), 7),
          },
        });
      }
    }
  }
}
