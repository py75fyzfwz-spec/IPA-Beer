# IPA-Beer

Website for learning to read British English (RP) in IPA, built for a German-speaking pronunciation course. Learners go from single sounds to words to sentences, read each transcription aloud, check it against a real recording, and rate themselves. FSRS spaced repetition decides what comes up each day. Dictation cards work the other way: hear a word and type it in IPA on an on-screen symbol keyboard.

Stack: Next.js 16 on Vercel, Supabase (email and password login, progress tables), [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs).

## Set up

1. Create a Supabase project.
2. In the Supabase SQL editor, run `supabase/migrations/20261026000000_init.sql`. It creates the progress tables with row-level security, so each user can only see their own rows.
3. In Supabase under Authentication > URL Configuration, set the Site URL to your Vercel URL and add `https://<your-domain>/auth/callback` to the redirect URLs. Add `http://localhost:3000/auth/callback` too for local development.
4. The project URL and publishable key are set in `src/lib/supabase/config.ts`. Both are public by design. To point the app at a different Supabase project, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see `.env.example`) in `.env.local` or in Vercel.
5. Run it:

```bash
npm install
npm run dev
```

Only the publishable key is used. The service role key is never needed and must not be added to this project.

## How it fits together

| Path | What it does |
| --- | --- |
| `src/content/` | All learning content as data: the 44 sounds, words, sentences. Words and sentences are sample entries for now. |
| `src/lib/srs.ts` | FSRS scheduling, unlock rules and the daily queue |
| `src/lib/ipa.ts` | Splits transcriptions into phonemes and checks dictation answers |
| `src/lib/progress.ts` | Reads and writes progress in Supabase |
| `src/app/study/` | The study session and the card types |
| `src/proxy.ts` | Refreshes the login session and protects `/study` and `/account` |
| `supabase/migrations/` | Database schema |

### Adding content

Add entries to `src/content/words.ts` or `src/content/sentences.ts`. Transcriptions use EPD symbols without slashes, with stress marks (`ˈmʌðə`). Keep each `id` stable once people have studied it, because progress is stored per card id.

Recordings go in `public/audio/sounds`, `public/audio/words` or `public/audio/sentences`. Set `audio: { src: "/audio/words/mother.mp3", credit: { … } }` on the entry. Words only get a dictation card once they have a recording. Openly licensed recordings must have a `credit`, which is listed on the Credits page.

### Unlock rules

- Sound cards come first, in the order of `sounds.ts`.
- A word unlocks once every sound in it has been introduced.
- A sentence unlocks once the words listed in its `words` field have been started.
- A dictation card unlocks once its word card has graduated to review.
