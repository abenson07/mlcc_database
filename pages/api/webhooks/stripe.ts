import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { serverSupabase } from '@/lib/serverSupabase';

// Disable body parsing, we need the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe webhook events for membership management:
 * - customer.subscription.deleted: Sets membership status to "Cancelled"
 * - customer.subscription.created: Reuses existing membership or creates new one
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  // Get the raw body for signature verification
  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    console.error('Missing stripe-signature header');
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', errorMessage);
    return res.status(400).json({ error: `Webhook signature verification failed: ${errorMessage}` });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success response to Stripe
    res.status(200).json({ received: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing webhook event:', errorMessage);
    console.error('Event type:', event.type);
    console.error('Event ID:', event.id);
    
    // Return 500 so Stripe will retry
    res.status(500).json({ error: errorMessage });
  }
}

/**
 * Handle subscription cancellation (deleted event)
 * Updates membership status to "Cancelled" when subscription is explicitly cancelled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id;
  const customerId = subscription.customer as string;

  console.log(`Processing subscription deletion: ${subscriptionId} for customer: ${customerId}`);

  // Find membership by stripe_subscription_id
  const { data: membership, error: findError } = await serverSupabase
    .from('memberships')
    .select('id, stripe_subscription_id, stripe_customer_id, customer_email, status')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (findError) {
    if (findError.code === 'PGRST116') {
      // No membership found with this subscription ID
      console.warn(`No membership found for subscription ID: ${subscriptionId}`);
      return;
    }
    throw new Error(`Error finding membership: ${findError.message}`);
  }

  if (!membership) {
    console.warn(`Membership not found for subscription ID: ${subscriptionId}`);
    return;
  }

  // Update membership status to "Cancelled"
  const { error: updateError } = await serverSupabase
    .from('memberships')
    .update({ status: 'Cancelled' })
    .eq('id', membership.id);

  if (updateError) {
    throw new Error(`Error updating membership status: ${updateError.message}`);
  }

  console.log(`Successfully updated membership ${membership.id} status to "Cancelled"`);
}

/**
 * Handle new subscription creation
 * Reuses existing membership if customer already has one, otherwise creates new membership
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id;
  const customerId = subscription.customer as string;
  const currentPeriodStart = new Date(subscription.current_period_start * 1000);
  const currentPeriodStartDate = currentPeriodStart.toISOString().split('T')[0]; // Format as YYYY-MM-DD

  console.log(`Processing subscription creation: ${subscriptionId} for customer: ${customerId}`);

  // Try to find existing membership by stripe_customer_id
  const { data: existingMembership, error: findError } = await serverSupabase
    .from('memberships')
    .select('id, stripe_customer_id, stripe_subscription_id, status')
    .eq('stripe_customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findError && findError.code !== 'PGRST116') {
    throw new Error(`Error finding existing membership: ${findError.message}`);
  }

  if (existingMembership) {
    // Reuse existing membership - update subscription ID and status
    console.log(`Reusing existing membership ${existingMembership.id} for customer ${customerId}`);

    const { error: updateError } = await serverSupabase
      .from('memberships')
      .update({
        stripe_subscription_id: subscriptionId,
        status: 'Active',
        last_renewal: currentPeriodStartDate,
        is_subscription: true,
      })
      .eq('id', existingMembership.id);

    if (updateError) {
      throw new Error(`Error updating existing membership: ${updateError.message}`);
    }

    console.log(`Successfully updated membership ${existingMembership.id} with new subscription ${subscriptionId}`);
  } else {
    // No existing membership found - fetch customer details and create new membership
    console.log(`No existing membership found for customer ${customerId}. Creating new membership for subscription ${subscriptionId}`);

    try {
      // Fetch customer details from Stripe
      const customer = await stripe.customers.retrieve(customerId);
      
      if (customer.deleted) {
        throw new Error(`Customer ${customerId} has been deleted in Stripe`);
      }

      const customerEmail = (customer as Stripe.Customer).email;
      
      if (!customerEmail) {
        throw new Error(`Customer ${customerId} has no email address`);
      }

      // Get product/tier information from subscription
      const priceId = subscription.items.data[0]?.price.id;
      let tier: string | undefined;
      
      if (priceId) {
        const price = await stripe.prices.retrieve(priceId);
        // You may need to map Stripe product/price to your tier enum values
        // For now, we'll try to extract tier from product name or metadata
        tier = price.metadata?.tier || price.nickname || undefined;
      }

      // Create new membership record
      const { data: newMembership, error: createError } = await serverSupabase
        .from('memberships')
        .insert({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_tier_id: subscription.items.data[0]?.price.product as string | undefined,
          customer_email: customerEmail,
          status: 'Active',
          tier: tier, // May need to be set manually if not available from Stripe
          last_renewal: currentPeriodStartDate,
          is_subscription: true,
          payment_method: 'card',
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Error creating new membership: ${createError.message}`);
      }

      console.log(`Successfully created new membership ${newMembership.id} for customer ${customerId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error creating membership for customer ${customerId}:`, errorMessage);
      // Re-throw to trigger webhook retry
      throw error;
    }
  }
}

/**
 * Helper function to get raw body buffer for signature verification
 */
async function buffer(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    req.on('error', reject);
  });
}

export default handler;

