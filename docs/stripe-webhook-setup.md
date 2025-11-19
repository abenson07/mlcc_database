# Stripe Webhook Integration Setup Guide

This guide walks you through setting up Stripe webhooks to automatically update membership statuses in Supabase when subscriptions are cancelled or created.

## Overview

The webhook endpoint at `/api/webhooks/stripe` handles two Stripe events:
- **`customer.subscription.deleted`**: Sets membership status to "Cancelled" when a subscription is explicitly cancelled
- **`customer.subscription.created`**: Reuses existing membership ID and updates status to "Active" when a customer re-subscribes

## Prerequisites

- Stripe account (test or live mode)
- Stripe CLI installed (for local testing)
- Access to your Supabase project

## Step 1: Get Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **API keys**
3. Copy your **Secret key** (starts with `sk_test_` for test mode or `sk_live_` for production)
4. Add it to your `.env.local` file:

```bash
STRIPE_SECRET_KEY=sk_test_...
```

## Step 2: Set Up Webhook Endpoint in Stripe Dashboard

### For Production

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your production webhook URL:
   ```
   https://yourdomain.com/api/webhooks/stripe
   ```
4. Select the events to listen to:
   - `customer.subscription.deleted`
   - `customer.subscription.created`
5. Click **Add endpoint**
6. After creating, click on the endpoint to view details
7. Click **Reveal** next to "Signing secret" and copy it
8. Add it to your `.env.local` file:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

### For Local Development

You'll use Stripe CLI to forward webhooks to your local server (see Step 3).

## Step 3: Test Locally with Stripe CLI

### Install Stripe CLI

**macOS (Homebrew):**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows (Scoop):**
```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Linux:**
```bash
# Download from https://github.com/stripe/stripe-cli/releases
# Or use package manager
```

### Authenticate Stripe CLI

1. Run:
```bash
stripe login
```
2. This will open your browser to authenticate

### Forward Webhooks to Local Server

1. Start your Next.js development server:
```bash
npm run dev
```

2. In another terminal, forward webhooks:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

3. Stripe CLI will display a webhook signing secret. Copy it and add to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

4. Restart your Next.js dev server to pick up the new environment variable

### Test Webhook Events

**Test subscription cancellation:**
```bash
stripe trigger customer.subscription.deleted
```

**Test subscription creation:**
```bash
stripe trigger customer.subscription.created
```

Check your server logs and Supabase database to verify the membership status was updated correctly.

## Step 4: Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...  # Webhook signing secret (different for local vs production)

# Supabase Configuration (should already exist)
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Important:** Never commit `.env.local` to version control. The webhook secret is different for:
- Local development (from Stripe CLI)
- Production (from Stripe Dashboard webhook endpoint)

## Step 5: Verify Webhook is Working

### Check Logs

When a webhook event is received, you should see logs like:
```
Processing subscription deletion: sub_xxx for customer: cus_xxx
Successfully updated membership 123 status to "Cancelled"
```

### Check Supabase

1. Go to your Supabase dashboard
2. Navigate to the `memberships` table
3. Verify that the `status` field updates correctly when subscriptions are cancelled/created

## Troubleshooting

### Webhook signature verification failed

- Ensure `STRIPE_WEBHOOK_SECRET` is set correctly
- Make sure you're using the correct secret (local vs production)
- Verify the raw body is being passed correctly (should be handled automatically by Next.js)

### Membership not found

- Check that `stripe_subscription_id` is correctly stored in the `memberships` table
- Verify the subscription ID in Stripe matches what's in your database
- Check webhook logs for the subscription ID being processed

### Status not updating

- Check Supabase logs for any database errors
- Verify the `status` field accepts "Cancelled" and "Active" values
- Ensure `serverSupabase` has proper permissions (uses service role key)

### Webhook not receiving events

- Verify webhook endpoint URL is correct in Stripe Dashboard
- Check that events are enabled for your webhook endpoint
- For local testing, ensure Stripe CLI is running and forwarding correctly
- Check firewall/network settings if testing production webhook

## How It Works

### Subscription Cancellation Flow

1. Customer cancels subscription in Stripe
2. Stripe sends `customer.subscription.deleted` event to webhook endpoint
3. Webhook handler:
   - Verifies webhook signature
   - Finds membership by `stripe_subscription_id`
   - Updates membership `status` to "Cancelled"

### Re-subscription Flow

1. Customer creates new subscription in Stripe
2. Stripe sends `customer.subscription.created` event to webhook endpoint
3. Webhook handler:
   - Verifies webhook signature
   - Looks for existing membership by `stripe_customer_id`
   - If found, reuses the membership ID and updates:
     - `stripe_subscription_id` → new subscription ID
     - `status` → "Active"
     - `last_renewal` → current period start date
   - If not found, logs a message (you may want to create a new membership)

## Security Notes

- Webhook signature verification ensures requests are from Stripe
- Uses `serverSupabase` with service role key (bypasses RLS) - appropriate for webhooks
- Never expose `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` in client-side code
- Webhook endpoint only accepts POST requests

## Next Steps

- Monitor webhook events in Stripe Dashboard → Developers → Webhooks → [Your Endpoint] → Events
- Set up error alerts if webhook processing fails
- Consider adding webhook event logging to a separate table for audit purposes
- Handle edge cases (e.g., creating new memberships when customer doesn't exist)


