# Membership CSV Import Instructions

## Prerequisites

1. **Supabase Project Linked**
   ```bash
   npm run db:link
   ```
   Follow prompts to enter your project reference ID.

2. **Environment Variables**
   Ensure `.env.local` contains:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (required for seed script)

3. **CSV File**
   Place `subscriptions.csv` in `/Users/alexbenson/Downloads/` (or update path in script)

## Step 1: Run Migrations

Apply the database schema changes:

```bash
npm run db:migrate
```

This will:
- Add missing columns to `memberships` table (stripe_customer_id, stripe_subscription_id, stripe_tier_id, customer_email, is_subscription, payment_method, last_renewal, created_at)
- Add `membership_id` foreign key column to `people` table
- Create necessary indexes

## Step 2: Regenerate Types (Optional)

After migrations, regenerate TypeScript types:

```bash
npm run db:types
```

## Step 3: Run Seed Script

Import the CSV data:

```bash
npx tsx scripts/seed-memberships.ts
```

The script will:
1. Parse `subscriptions.csv`
2. Filter out "Business Memberships"
3. For each row:
   - Find or create person by email
   - Create membership record
   - Link membership to person
4. Display summary of imports

## What Gets Imported

- **Memberships**: One per subscription (excluding business memberships)
- **People**: Created if email doesn't exist, updated if exists
- **Links**: `people.membership_id` → `memberships.id`

## Column Mappings

| CSV Column | Database Column | Notes |
|------------|----------------|-------|
| Customer Email | people.email (join key) | Case-insensitive matching |
| Customer Name | people.full_name | Updated if person exists |
| Product | memberships.tier | Parsed to enum (household/individual/senior/student) |
| Product ID | memberships.stripe_tier_id | Stripe tier identifier |
| Customer ID | memberships.stripe_customer_id | Stripe customer ID |
| id (subscription) | memberships.stripe_subscription_id | Unique Stripe subscription ID |
| Created (UTC) | memberships.created_at | Timestamp |
| Current Period Start (UTC) | memberships.last_renewal | Date only (no time) |
| Status | memberships.status | Always "active" |
| - | memberships.is_subscription | Always `true` |
| - | memberships.payment_method | Always "card" |

## Troubleshooting

### "Missing Supabase environment variables"
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- Get it from: Supabase Dashboard → Project Settings → API → service_role key

### "Enum value not found" errors
- Check the actual enum values in Supabase:
  ```sql
  SELECT unnest(enum_range(NULL::membership_status));
  SELECT unnest(enum_range(NULL::membership_tier));
  ```
- Update the `parseMembershipTier()` function in the script if values differ

### Duplicate subscription errors
- Script skips duplicates automatically (based on `stripe_subscription_id` unique constraint)
- Safe to re-run if needed

### CSV file not found
- Update the `csvPath` variable in `scripts/seed-memberships.ts` to point to your CSV location


