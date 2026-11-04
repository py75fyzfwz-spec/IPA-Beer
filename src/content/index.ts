import { recordings } from "./recordings";
import { sentences as sentenceEntries } from "./sentences";
import { sounds as soundEntries } from "./sounds";
import type { Audio, StudyCard } from "./types";
import { words as wordEntries } from "./words";

// Attach the teacher's recording to each entry that has none of its own.
// This runs before allCards is built, because dictation cards need audio.
function withRecording<T extends { id: string; audio?: Audio }>(kind: string, items: T[]): T[] {
  return items.map((item) => {
    const src = recordings[`${kind}:${item.id}`];
    if (item.audio || !src) return item;
    return { ...item, audio: { src } };
  });
}

const sounds = withRecording("sound", soundEntries);
const words = withRecording("word", wordEntries);
const sentences = withRecording("sentence", sentenceEntries);

const byUnit = <T extends { unit: number }>(items: T[]) =>
  [...items].sort((a, b) => a.unit - b.unit);

// Every card in introduction order: sounds first, then words, then
// sentences. Dictation cards follow their word and need a recording.
export const allCards: StudyCard[] = [
  ...sounds.map((sound): StudyCard => ({ id: `sound:${sound.id}`, kind: "sound", sound })),
  ...byUnit(words).flatMap((word): StudyCard[] => [
    { id: `word:${word.id}`, kind: "word", word },
    ...(word.audio ? [{ id: `dictation:${word.id}`, kind: "dictation" as const, word }] : []),
  ]),
  ...byUnit(sentences).map((sentence): StudyCard => ({ id: `sentence:${sentence.id}`, kind: "sentence", sentence })),
];

// Vowels belong to unit 1, consonants to unit 2.
export function unitOf(card: StudyCard): number {
  switch (card.kind) {
    case "sound":
      return card.sound.group === "consonant" ? 2 : 1;
    case "word":
    case "dictation":
      return card.word.unit;
    case "sentence":
      return card.sentence.unit;
  }
}

export function cardsInUnit(unit: number) {
  return allCards.filter((c) => unitOf(c) === unit);
}

export { sentences, sounds, words };
export { teacher } from "./recordings";
export { units, type Unit } from "./units";
export { stressMarks, weakVowels } from "./sounds";
