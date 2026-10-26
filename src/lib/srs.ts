import { createEmptyCard, fsrs, generatorParameters, State, type Card, type Grade } from "ts-fsrs";
import { allCards, sounds } from "@/content";
import type { StudyCard } from "@/content/types";
import { tokenize } from "./ipa";

// FSRS with default parameters and 90% target recall. The review log keeps
// every rating, so the parameters can be fitted to real data later.
export const scheduler = fsrs(generatorParameters({ request_retention: 0.9, enable_fuzz: true }));

export const newCard = (now: Date) => createEmptyCard(now);

export function preview(card: Card, now: Date, grade: Grade) {
  return scheduler.next(card, now, grade).card;
}

// "1 min", "10 min", "3 days" ... for the rating buttons.
export function formatInterval(from: Date, to: Date) {
  const minutes = Math.max(1, Math.round((to.getTime() - from.getTime()) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 31) return days === 1 ? "1 day" : `${days} days`;
  const months = Math.round(days / 30);
  return months === 1 ? "1 month" : `${months} months`;
}

const soundIdByIpa = new Map(sounds.map((s) => [s.ipa, `sound:${s.id}`]));

// Sound card ids for every phoneme in a transcription. Stress marks, spaces
// and weak vowels without a card of their own are ignored.
function soundCardsIn(ipa: string) {
  return tokenize(ipa).flatMap((t) => soundIdByIpa.get(t) ?? []);
}

// A card unlocks once everything it builds on has been introduced:
// words need their sounds, sentences their words (or sounds), and a
// dictation card needs its word card to have graduated to review.
export function isUnlocked(card: StudyCard, states: Map<string, Card>) {
  const started = (id: string) => states.has(id);
  switch (card.kind) {
    case "sound":
      return true;
    case "word":
      return soundCardsIn(card.word.ipa).every(started);
    case "sentence":
      return card.sentence.words?.length
        ? card.sentence.words.every((w) => started(`word:${w}`))
        : soundCardsIn(card.sentence.ipa).every(started);
    case "dictation":
      return states.get(`word:${card.word.id}`)?.state === State.Review;
  }
}

// Today's session: due reviews first (most overdue first), then new cards
// in course order up to the daily limit.
export function buildQueue(states: Map<string, Card>, newLeft: number, now: Date): StudyCard[] {
  const due = allCards
    .filter((c) => {
      const s = states.get(c.id);
      return s && s.due <= now;
    })
    .sort((a, b) => states.get(a.id)!.due.getTime() - states.get(b.id)!.due.getTime());

  const fresh: StudyCard[] = [];
  // Unlocking is checked against a growing set, so a word whose last sound
  // is introduced earlier in this same session can join it too.
  const planned = new Map(states);
  for (const card of allCards) {
    if (fresh.length >= newLeft) break;
    if (planned.has(card.id) || !isUnlocked(card, planned)) continue;
    fresh.push(card);
    planned.set(card.id, newCard(now));
  }

  return [...due, ...fresh];
}

// Cards in the current session that are due again within this window
// (FSRS learning steps) come back before the session ends.
export const RELEARN_WINDOW_MS = 20 * 60 * 1000;
