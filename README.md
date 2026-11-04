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

### Adding content

Add entries to `src/content/words.ts` or `src/content/sentences.ts`. Give words a `spelling` and sentences a `text`: it is shown only after Check, as the answer. Transcriptions use EPD symbols without slashes, with stress marks (`ˈmʌðə`). Keep each `id` stable once people have studied it, because progress is stored per card id.

Recordings go in `public/audio/sounds`, `public/audio/words` or `public/audio/sentences`. Set `audio: { src: "/audio/words/mother.mp3", credit: { … } }` on the entry. Words only get a dictation card once they have a recording. Openly licensed recordings must have a `credit`, which is listed on the Credits page.

### Unlock rules

- Sound cards come first, in the order of `sounds.ts`.
- A word unlocks once every sound in it has been introduced.
- A sentence unlocks once the words listed in its `words` field have been started.
- A dictation card unlocks once its word card has graduated to review.
