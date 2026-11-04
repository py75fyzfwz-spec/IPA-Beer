import { State, type Card, type Grade, type RecordLogItem } from "ts-fsrs";

// Progress lives in this browser's localStorage for now. Each device keeps
// its own progress; accounts and syncing can come later.
const KEY = "ipa.progress.v1";

type StoredCard = Omit<Card, "due" | "last_review"> & { due: string; last_review?: string };

type Stored = {
  cards: Record<string, StoredCard>;
  // Card ids first seen today, keyed by local date, to enforce the daily limit.
  newByDay: Record<string, string[]>;
  newPerDay: number;
};

export type Progress = {
  states: Map<string, Card>;
  newToday: number;
  newPerDay: number;
};

export const DEFAULT_NEW_PER_DAY = 10;

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function read(): Stored {
  const empty: Stored = { cards: {}, newByDay: {}, newPerDay: DEFAULT_NEW_PER_DAY };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    return { ...empty, ...(JSON.parse(raw) as Partial<Stored>) };
  } catch {
    return empty;
  }
}

function write(data: Stored) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function toCard(c: StoredCard): Card {
  return { ...c, due: new Date(c.due), last_review: c.last_review ? new Date(c.last_review) : undefined };
}

export function loadProgress(): Progress {
  const data = read();
  return {
    states: new Map(Object.entries(data.cards).map(([id, c]) => [id, toCard(c)])),
    newToday: data.newByDay[today()]?.length ?? 0,
    newPerDay: data.newPerDay,
  };
}

// Saves one rating. Throws if the browser refuses to store it.
export function saveReview(cardId: string, _grade: Grade, result: RecordLogItem) {
  const data = read();
  const { card, log } = result;
  data.cards[cardId] = { ...card, due: card.due.toISOString(), last_review: card.last_review?.toISOString() };
  if (log.state === State.New) {
    const day = today();
    // Keep only today's list so the stored data doesn't grow forever.
    data.newByDay = { [day]: [...new Set([...(data.newByDay[day] ?? []), cardId])] };
  }
  write(data);
}

export function saveNewPerDay(n: number) {
  const data = read();
  data.newPerDay = n;
  write(data);
}

export function resetProgress() {
  localStorage.removeItem(KEY);
}
