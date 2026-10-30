// The project URL and publishable key are public by design: every visitor's
// browser receives them, and row-level security keeps each user's data
// private. Environment variables override them, e.g. for a second project.
// Never put the secret key here.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hjaoyodyttycjjvofrbb.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_RiUcjG2wDsxwdzxwKgOIPQ_ehBvCCUi";
