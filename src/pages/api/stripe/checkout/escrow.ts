import { getAuth } from '@clerk/nextjs/server';
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { env } from '~/env.js';
import { db } from '~/server/db';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-02-25.clover',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { negotiationId } = req.body as { negotiationId: string };

    if (!negotiationId) {
      return res.status(400).json({ message: 'Missing negotiationId' });
    }

    // Get negotiation with validation
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

    if (!negotiation) {
      return res.status(404).json({ message: 'Negotiation not found' });
    }

    // Verify user is investor or VC
    const isInvestor = negotiation.investor?.userId === userId;
    const isVc = negotiation.VcGroup?.userId === userId;

    if (!isInvestor && !isVc) {
      return res.status(403).json({ message: 'Only investors can initiate payment' });
    }

    // Verify both parties confirmed
    if (
      !negotiation.investorCompletionConfirmedAt ||
      !negotiation.entrepreneurCompletionConfirmedAt
    ) {
      return res
        .status(400)
        .json({ message: 'Both parties must confirm completion before payment' });
    }

    // Verify agreed amount exists
    if (!negotiation.agreedInvestmentAmount) {
      return res.status(400).json({ message: 'No investment amount agreed' });
    }

    // Get or create Stripe customer
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let customerId = user.stripeCustomerId;

    if (customerId) {
      // Validate customer exists
      try {
        const existing = await stripe.customers.retrieve(customerId);
        if (existing.deleted) customerId = null;
      } catch {
        customerId = null;
        await db.user.update({ where: { id: userId }, data: { stripeCustomerId: null } });
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });

      customerId = customer.id;

      await db.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(negotiation.agreedInvestmentAmount.toNumber() * 100);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Investment in ${negotiation.project.name}`,
              description: `Escrow payment for investment of $${negotiation.agreedInvestmentAmount.toNumber().toLocaleString()}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/negotiations/${negotiationId}?payment=success`,
      cancel_url: `${req.headers.origin}/negotiations/${negotiationId}?payment=cancelled`,
      metadata: {
        negotiationId: negotiation.id,
        projectId: negotiation.projectId,
        investorId: negotiation.investorId ?? '',
        vcGroupId: negotiation.vcGroupId ?? '',
        entrepreneurId: negotiation.project.Entrepreneur?.id ?? '',
        amount: negotiation.agreedInvestmentAmount.toString(),
        paymentType: 'escrow',
      },
    });

    // Update negotiation with checkout session ID
    await db.negotiation.update({
      where: { id: negotiationId },
      data: {
        stripeCheckoutSessionId: session.id,
        paymentStatus: 'CHECKOUT_GENERATED',
      },
    });

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Escrow checkout error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
