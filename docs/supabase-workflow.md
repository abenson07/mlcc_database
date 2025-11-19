# Supabase Migration-First Workflow

This document explains how to use the Supabase migration workflow in this project.

## Setup

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `@supabase/supabase-js` - Supabase client library
- `zod` - Schema validation
- `supabase` CLI - For migrations and type generation

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (server-only)

### 3. Link Supabase Project

Link your local project to your Supabase project:

```bash
npm run db:link
```

Follow the prompts to enter your project reference ID.

## File Structure

```
mlcc-dashboard/
├── lib/
│   ├── supabaseClient.ts    # Client-side Supabase (browser-safe)
│   └── serverSupabase.ts    # Server-side Supabase (API routes, SSR)
├── supabase/
│   ├── config.toml          # Supabase CLI configuration
│   └── migrations/          # SQL migration files
├── src/
│   └── types/
│       └── database.types.ts # Generated TypeScript types
├── pages/
│   └── api/                  # Next.js API routes
└── hooks/                    # React hooks for data fetching
```

## Workflow

### Creating a New Migration

1. **Create migration file**:
   ```bash
   supabase migration new feature_name
   ```
   This creates a timestamped file in `supabase/migrations/`

2. **Write SQL** in the migration file:
   ```sql
   -- Create table
   CREATE TABLE example_table (
     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
     created_at timestamptz DEFAULT now() NOT NULL,
     name text NOT NULL
   );

   -- Enable RLS
   ALTER TABLE example_table ENABLE ROW LEVEL SECURITY;

   -- Create policies
   CREATE POLICY "Public read access"
     ON example_table FOR SELECT
     USING (true);
   ```

3. **Push migration**:
   ```bash
   npm run db:migrate
   ```

4. **Regenerate types**:
   ```bash
   npm run db:types
   ```

### Using Types in Code

After generating types, import them:

```typescript
import { Database } from '@/src/types/database.types';

type ExampleRow = Database['public']['Tables']['example_table']['Row'];
```

### Creating API Routes

1. Create file: `pages/api/example/create.ts`
2. Use `serverSupabase` for database operations
3. Validate inputs with Zod
4. Use generated types for type safety

Example:
```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { serverSupabase } from '@/lib/serverSupabase';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const validated = schema.parse(req.body);
    const { data, error } = await serverSupabase
      .from('example_table')
      .insert(validated);

    if (error) throw error;
    return res.status(201).json({ data });
  } catch (error) {
    return res.status(400).json({ error: 'Failed to create' });
  }
}
```

### Creating Client Hooks

For reads (if RLS allows):
```typescript
import { supabase } from '@/lib/supabaseClient';

export const useExamples = () => {
  const { data, error } = await supabase
    .from('example_table')
    .select('*');
  // ...
};
```

For writes (always use API routes):
```typescript
export const useCreateExample = () => {
  const create = async (data: CreateInput) => {
    const res = await fetch('/api/example/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  };
  // ...
};
```

## Available Scripts

- `npm run db:migrate` - Push migrations to Supabase
- `npm run db:reset` - Reset local database (if using local Supabase)
- `npm run db:types` - Generate TypeScript types from schema
- `npm run db:link` - Link to Supabase project (one-time setup)

## Important Rules

1. **Never modify tables directly in Supabase dashboard** - always use migrations
2. **Always enable RLS** on new tables
3. **Always regenerate types** after schema changes
4. **Use `serverSupabase`** in API routes and `getServerSideProps`
5. **Use `supabaseClient`** in React components and hooks
6. **Never expose service role key** to client code
7. **Always validate inputs** with Zod before database operations

## Feature Request Process

When requesting a new feature:

1. Fill out the feature request template: `docs/feature-request-template.md`
2. The AI agent will:
   - Create migration(s) for schema changes
   - Generate types
   - Create API routes
   - Create/update hooks
   - Update frontend components

See `.cursor/agent.md` for detailed implementation guidelines.


