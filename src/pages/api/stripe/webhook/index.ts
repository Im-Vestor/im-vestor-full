import { env } from '~/env.js';
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { db } from '~/server/db';
import { addDays } from 'date-fns';
import { type Readable } from 'stream';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: Readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

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
    apiVersion: '2026-02-25.clover' as any,
  });

  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    return res.status(400).json({ message: 'Missing stripe signature' });
  }

  try {
    const buf = await buffer(req);
    const event = stripe.webhooks.constructEvent(buf, signature, env.STRIPE_WEBHOOK_SECRET);

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
      // Product 'poke' represents "3 Pokes" per unit
      await db.user.update({
        where: { id: userId },
        data: {
          availablePokes: {
            increment: 2,
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

    if (userId && productType === 'public-pitch-ticket') {
      // Increment user's available public pitch tickets
      await db.user.update({
        where: { id: userId },
        data: {
          availablePublicPitchTickets: {
            increment: 1,
          },
        },
      });

      // Notify the user that their pitch ticket is ready
      await db.notification.create({
        data: {
          userId,
          type: 'PITCH_TICKET_PURCHASED',
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

    // Handle escrow payment for negotiations
    const paymentType = session.metadata?.paymentType;
    const negotiationId = session.metadata?.negotiationId;

    if (paymentType === 'escrow' && negotiationId) {
      // Get the payment intent to extract amount
      const paymentIntentId = session.payment_intent as string;

      // Update negotiation with payment received status
      await db.negotiation.update({
        where: { id: negotiationId },
        data: {
          stripePaymentIntentId: paymentIntentId,
          paymentStatus: 'PAYMENT_RECEIVED',
          paidAt: new Date(),
          paymentAmount: session.amount_total ? session.amount_total / 100 : null,
        },
      });

      // Get negotiation details for email notifications
      const negotiation = await db.negotiation.findUnique({
        where: { id: negotiationId },
        include: {
          investor: true,
          VcGroup: true,
          project: {
            include: {
              Entrepreneur: true,
            },
          },
        },
      });

      if (negotiation) {
        // Send confirmation email to investor
        const investor = negotiation.investor;
        const vcGroup = negotiation.VcGroup;
        const entrepreneur = negotiation.project.Entrepreneur;

        // Email logic will be handled by the tRPC procedure or separate email service
        // For now, just log the success
        console.log(`[STRIPE WEBHOOK] Escrow payment received for negotiation ${negotiationId}`);
        console.log(
          `[STRIPE WEBHOOK] Amount: $${session.amount_total ? session.amount_total / 100 : 0}`
        );
      }
    }
  }
}
