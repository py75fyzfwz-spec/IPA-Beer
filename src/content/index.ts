import { sentences } from "./sentences";
import { sounds } from "./sounds";
import type { StudyCard } from "./types";
import { words } from "./words";

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

export { sentences, sounds, words };
export { stressMarks, weakVowels } from "./sounds";
