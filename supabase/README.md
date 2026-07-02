# SimpleDesk Supabase

## Apply MVP schema

Open Supabase Dashboard -> SQL Editor and run:

```text
supabase/migrations/0001_initial_schema.sql
```

The migration creates the initial SaaS data model and enables Row Level Security.

## Environment variables

Use these variables locally and in Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Do not expose the database password, `service_role` key, or Supabase access tokens in client code.
