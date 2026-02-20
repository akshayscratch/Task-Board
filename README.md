# Simple Task Management Platform

## Setup

1.  Copy `.env.example` to `.env`.
2.  Fill in your Supabase URL and Keys.
    *   `VITE_SUPABASE_URL`: Your Supabase Project URL (e.g., https://xyz.supabase.co)
    *   `VITE_SUPABASE_ANON_KEY`: The Publishable Key provided.
3.  Run `npm install` (if not already done).
4.  Run `npm run dev`.

## Supabase Setup
Ensure your Supabase project has the following tables:
- `users`
- `tasks`
- `comments`
And Row Level Security policies enabled.
