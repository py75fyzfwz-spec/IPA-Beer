# Speaking English

Website for learning to read British English (RP) in IPA, built for a German-speaking pronunciation course. Learners go from single sounds to words to sentences, read each transcription aloud, check it against a real recording, and rate themselves. FSRS spaced repetition decides what comes up each day. Dictation cards work the other way: hear a word and type it in IPA on an on-screen symbol keyboard.

Stack: Next.js 16 on Vercel, [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs). There are no accounts yet: progress is saved in the browser's localStorage, so each device keeps its own.

## Set up

```bash
npm install
npm run dev
```

## How it fits together

| Path | What it does |
| --- | --- |
| `src/content/` | All learning content as data: the 44 sounds, words, sentences. Words and sentences are sample entries for now. |
| `src/lib/srs.ts` | FSRS scheduling, unlock rules and the daily queue |
| `src/lib/ipa.ts` | Splits transcriptions into phonemes and checks dictation answers |
| `src/lib/progress.ts` | Reads and writes progress in localStorage |
| `src/app/study/` | The study session and the card types |
| `src/app/teacher/` | Teacher mode: record cards and add new ones, saved to Supabase |

### Adding content

Add entries to `src/content/words.ts` or `src/content/sentences.ts`. Give words a `spelling` and sentences a `text`: it is shown only after Check, as the answer. Transcriptions use EPD symbols without slashes, with stress marks (`ˈmʌðə`). Keep each `id` stable once people have studied it, because progress is stored per card id.

Recordings go in `public/audio/sounds`, `public/audio/words` or `public/audio/sentences`, as mp3. The teacher's recordings are linked in `src/content/recordings.ts` by card id (`"word:mother": "/audio/words/mother.mp3"`), so card content and audio can change separately; set `teacher` there to thank them on the Credits page. Other recordings can instead set `audio: { src, credit: { … } }` directly on the entry, which wins over `recordings.ts`. Words only get a dictation card once they have a recording. Openly licensed recordings must have a `credit`, which is listed on the Credits page.

### Teacher mode

`/teacher` (linked in the footer) lets the teacher record cards and add new ones without touching the code. Pick a unit and go through its cards one by one: press Record (or space), listen back, then Save and next (or Enter). Under Add cards, type a word or sentence with its IPA, then record it straight away. Everything is saved in Supabase and reaches learners within about a minute. Cards in `src/content/` stay the main source; teacher mode adds on top of them, and a recording set in the code wins over one made in teacher mode.

One-time setup:

1. In Supabase, open the SQL Editor and run [`supabase/teacher-mode.sql`](supabase/teacher-mode.sql). It creates two tables and a public `teacher-recordings` storage bucket.
2. In Vercel, under Project → Settings → Environment Variables, add `TEACHER_PASSCODE` (any passcode you choose), `SUPABASE_URL`, and `SUPABASE_SECRET_KEY` (the secret or `service_role` key from Supabase's API settings). Then redeploy.

The secret key stays on the server. Learners' browsers only read the list of added cards and recordings through `/api/teacher-content`.



- Sound cards come first, in the order of `sounds.ts`.
- A word unlocks once every sound in it has been introduced.
- A sentence unlocks once the words listed in its `words` field have been started.
- A dictation card unlocks once its word card has graduated to review.
