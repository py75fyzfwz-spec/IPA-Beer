import { State, type Card } from "ts-fsrs";
import type { StudyCard } from "@/content/types";

export type UnitProgress = {
  total: number;
  learned: number; // graduated to review in FSRS
  learning: number; // studied at least once but still in learning steps
};

// A card counts as learned once it has left the learning steps. Cards that
// lapsed and are being relearned count as studied, not learned.
export function unitProgress(cards: StudyCard[], states: Map<string, Card>): UnitProgress {
  let learned = 0;
  let learning = 0;
  for (const card of cards) {
    const s = states.get(card.id);
    if (!s) continue;
    if (s.state === State.Review) learned++;
    else learning++;
  }
  return { total: cards.length, learned, learning };
}
