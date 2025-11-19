-- Add missing columns to memberships table for CSV import
-- These columns store Stripe data and membership details

-- Stripe identifiers
ALTER TABLE memberships 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_tier_id TEXT;

-- Membership metadata
ALTER TABLE memberships 
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS is_subscription BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS last_renewal DATE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Create indexes for lookups
CREATE INDEX IF NOT EXISTS idx_memberships_stripe_customer_id ON memberships(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_memberships_stripe_subscription_id ON memberships(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_memberships_email ON memberships((customer_email));

-- Add comment for documentation
COMMENT ON COLUMN memberships.stripe_customer_id IS 'Stripe customer ID for deduplication and lookups';
COMMENT ON COLUMN memberships.stripe_subscription_id IS 'Stripe subscription ID, unique identifier';
COMMENT ON COLUMN memberships.stripe_tier_id IS 'Stripe product/tier ID';
COMMENT ON COLUMN memberships.is_subscription IS 'Whether this is a subscription-based membership';
COMMENT ON COLUMN memberships.payment_method IS 'Payment method used (e.g., card)';
COMMENT ON COLUMN memberships.last_renewal IS 'Date of last payment/renewal';

