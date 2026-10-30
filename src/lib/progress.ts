import type { SupabaseClient } from "@supabase/supabase-js";
import { State, type Card, type Grade, type RecordLogItem } from "ts-fsrs";

type StateRow = {
  card_id: string;
  due: string;
  stability: number;
  difficulty: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: string | null;
};

function toCard(row: StateRow): Card {
  return {
    due: new Date(row.due),
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: 0,
    scheduled_days: row.scheduled_days,
    learning_steps: row.learning_steps,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state as State,
    last_review: row.last_review ? new Date(row.last_review) : undefined,
  };
}

export type Progress = {
  states: Map<string, Card>;
  newToday: number;
  newPerDay: number;
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Loads everything the study screen needs for the signed-in user.
// Row-level security means these queries only ever see their own rows.
export async function loadProgress(supabase: SupabaseClient): Promise<Progress> {
  const [states, log, profile] = await Promise.all([
    supabase.from("review_state").select("*"),
    supabase
      .from("review_log")
      .select("card_id")
      .eq("state", State.New)
      .gte("reviewed_at", startOfToday().toISOString()),
    supabase.from("profiles").select("new_per_day").maybeSingle(),
  ]);
  if (states.error) throw states.error;
  if (log.error) throw log.error;
  if (profile.error) throw profile.error;

  return {
    states: new Map((states.data as StateRow[]).map((r) => [r.card_id, toCard(r)])),
    newToday: new Set(log.data.map((r) => r.card_id)).size,
    newPerDay: profile.data?.new_per_day ?? 10,
  };
}

// Saves one rating: the card's new state and a log entry of the old one.
export async function saveReview(
  supabase: SupabaseClient,
  userId: string,
  cardId: string,
  grade: Grade,
  result: RecordLogItem,
) {
  const { card, log } = result;
  const stateWrite = supabase.from("review_state").upsert({
    user_id: userId,
    card_id: cardId,
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review?.toISOString() ?? null,
    updated_at: new Date().toISOString(),
  });
  const logWrite = supabase.from("review_log").insert({
    user_id: userId,
    card_id: cardId,
    rating: grade,
    state: log.state,
    due: log.due.toISOString(),
    stability: log.stability,
    difficulty: log.difficulty,
    scheduled_days: log.scheduled_days,
    learning_steps: log.learning_steps,
    reviewed_at: log.review.toISOString(),
  });
  const [a, b] = await Promise.all([stateWrite, logWrite]);
  if (a.error) throw a.error;
  if (b.error) throw b.error;
}

export async function saveNewPerDay(supabase: SupabaseClient, userId: string, newPerDay: number) {
  const { error } = await supabase.from("profiles").upsert({ user_id: userId, new_per_day: newPerDay });
  if (error) throw error;
}
