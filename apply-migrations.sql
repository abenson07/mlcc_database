-- Run this SQL directly in Supabase SQL Editor
-- Go to: https://app.supabase.com/project/uazyyjlurexdtlvavalz/sql/new

-- Migration 1: Add missing columns to memberships table
ALTER TABLE memberships 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_tier_id TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Add unique constraint on stripe_subscription_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_stripe_subscription_id_key'
  ) THEN
    ALTER TABLE memberships ADD CONSTRAINT memberships_stripe_subscription_id_key UNIQUE (stripe_subscription_id);
  END IF;
END $$;

-- Create indexes for lookups
CREATE INDEX IF NOT EXISTS idx_memberships_stripe_customer_id ON memberships(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_memberships_stripe_subscription_id ON memberships(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_memberships_email ON memberships((customer_email));

-- Migration 2: Add membership_id foreign key to people table
ALTER TABLE people 
ADD COLUMN IF NOT EXISTS membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL;

-- Create index for membership lookups
CREATE INDEX IF NOT EXISTS idx_people_membership_id ON people(membership_id);

-- Add comments for documentation
COMMENT ON COLUMN memberships.stripe_customer_id IS 'Stripe customer ID for deduplication and lookups';
COMMENT ON COLUMN memberships.stripe_subscription_id IS 'Stripe subscription ID, unique identifier';
COMMENT ON COLUMN memberships.stripe_tier_id IS 'Stripe product/tier ID';
COMMENT ON COLUMN memberships.is_subscription IS 'Whether this is a subscription-based membership';
COMMENT ON COLUMN memberships.payment_method IS 'Payment method used (e.g., card)';
COMMENT ON COLUMN memberships.last_renewal IS 'Date of last payment/renewal';
COMMENT ON COLUMN people.membership_id IS 'Foreign key to memberships table, links person to their active membership';

-- Verify columns were added
SELECT 'Memberships columns:' as info;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'memberships' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'People columns:' as info;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'people' AND table_schema = 'public'
ORDER BY ordinal_position;


