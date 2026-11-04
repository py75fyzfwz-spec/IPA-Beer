import type { Audio, Sentence, StudyCard, Word } from "@/content/types";

// What teacher mode adds on top of src/content/: new cards and recordings.
// Shared by the server (which reads it from Supabase) and the study page
// (which merges it into the card list). No server-only code in this file.

export type TeacherCard = {
  cardId: string; // "word:<slug>" or "sentence:<slug>"
  unit: number;
  ipa: string;
  spelling?: string;
  text?: string;
  words?: string[];
  requireStress?: boolean;
};

export type TeacherContent = {
  cards: TeacherCard[];
  recordings: Record<string, string>; // card id → audio URL
};

export const emptyTeacherContent: TeacherContent = { cards: [], recordings: {} };

// "Bread and butter!" → "bread-and-butter"
export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

export function toEntry(card: TeacherCard): { kind: "word"; word: Word } | { kind: "sentence"; sentence: Sentence } {
  const id = card.cardId.slice(card.cardId.indexOf(":") + 1);
  if (card.cardId.startsWith("word:")) {
    return {
      kind: "word",
      word: { id, ipa: card.ipa, spelling: card.spelling, unit: card.unit, requireStress: card.requireStress || undefined },
    };
  }
  return { kind: "sentence", sentence: { id, ipa: card.ipa, text: card.text, unit: card.unit, words: card.words?.length ? card.words : undefined } };
}

const byUnit = <T extends { unit: number }>(items: T[]) => [...items].sort((a, b) => a.unit - b.unit);

// The full card list with teacher mode's additions, in the same order as
// content/index.ts builds it: sounds, then words by unit (each followed by
// its dictation card once it has audio), then sentences by unit.
// Audio already on a card (from src/content/) wins over teacher mode's.
export function mergeTeacherContent(base: StudyCard[], extra: TeacherContent): StudyCard[] {
  if (extra.cards.length === 0 && Object.keys(extra.recordings).length === 0) return base;
  const audioFor = (cardId: string, own?: Audio): Audio | undefined =>
    own ?? (extra.recordings[cardId] ? { src: extra.recordings[cardId] } : undefined);

  const sounds = base.flatMap((c) => (c.kind === "sound" ? [c.sound] : []));
  const words = base.flatMap((c) => (c.kind === "word" ? [c.word] : []));
  const sentences = base.flatMap((c) => (c.kind === "sentence" ? [c.sentence] : []));
  const taken = new Set(base.map((c) => c.id));
  for (const card of extra.cards) {
    if (taken.has(card.cardId)) continue;
    taken.add(card.cardId);
    const entry = toEntry(card);
    if (entry.kind === "word") words.push(entry.word);
    else sentences.push(entry.sentence);
  }

  return [
    ...sounds.map((s): StudyCard => ({ id: `sound:${s.id}`, kind: "sound", sound: { ...s, audio: audioFor(`sound:${s.id}`, s.audio) } })),
    ...byUnit(words).flatMap((w): StudyCard[] => {
      const word = { ...w, audio: audioFor(`word:${w.id}`, w.audio) };
      return [
        { id: `word:${w.id}`, kind: "word", word },
        ...(word.audio ? [{ id: `dictation:${w.id}`, kind: "dictation" as const, word }] : []),
      ];
    }),
    ...byUnit(sentences).map((s): StudyCard => ({
      id: `sentence:${s.id}`,
      kind: "sentence",
      sentence: { ...s, audio: audioFor(`sentence:${s.id}`, s.audio) },
    })),
  ];
}
