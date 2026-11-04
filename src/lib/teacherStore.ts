import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { allCards } from "@/content";
import type { TeacherCard, TeacherContent } from "./teacherContent";

// Teacher mode's storage in Supabase (see supabase/teacher-mode.sql).
// Server only: it uses the secret key, which can bypass row level security.

const BUCKET = "teacher-recordings";

let client: SupabaseClient | null = null;

export function storageConfigured() {
  return Boolean(supabaseUrl() && secretKey());
}

const supabaseUrl = () => process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = () => process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

function db() {
  const url = supabaseUrl();
  const key = secretKey();
  if (!url || !key) throw new Error("Supabase isn't set up");
  client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

type CardRow = {
  card_id: string;
  unit: number;
  ipa: string;
  spelling: string | null;
  text: string | null;
  words: string[] | null;
  require_stress: boolean;
};

const fromRow = (r: CardRow): TeacherCard => ({
  cardId: r.card_id,
  unit: r.unit,
  ipa: r.ipa,
  spelling: r.spelling ?? undefined,
  text: r.text ?? undefined,
  words: r.words ?? undefined,
  requireStress: r.require_stress || undefined,
});

const staticIds = new Set(allCards.filter((c) => c.kind !== "dictation").map((c) => c.id));

export async function loadTeacherContent(): Promise<TeacherContent> {
  const [cards, recs] = await Promise.all([
    db().from("teacher_cards").select("*").order("created_at"),
    db().from("teacher_recordings").select("card_id, path"),
  ]);
  if (cards.error) throw cards.error;
  if (recs.error) throw recs.error;
  const storage = db().storage.from(BUCKET);
  return {
    cards: (cards.data as CardRow[]).map(fromRow),
    recordings: Object.fromEntries(
      (recs.data as { card_id: string; path: string }[]).map((r) => [r.card_id, storage.getPublicUrl(r.path).data.publicUrl]),
    ),
  };
}

// A card the teacher can record: one from src/content/ or one added here.
export async function isRecordable(cardId: string) {
  if (staticIds.has(cardId)) return true;
  const { data, error } = await db().from("teacher_cards").select("card_id").eq("card_id", cardId).maybeSingle();
  if (error) throw error;
  return data !== null;
}

const extension = (type: string) =>
  type.includes("mp4") || type.includes("aac") || type.includes("m4a") ? "m4a"
  : type.includes("webm") ? "webm"
  : type.includes("ogg") ? "ogg"
  : type.includes("mpeg") ? "mp3"
  : type.includes("wav") ? "wav"
  : "audio";

// Each take gets a new file name, so a re-recording never hides behind a
// cached copy of the old one. The previous take is removed afterwards.
export async function saveRecording(cardId: string, audio: Blob) {
  const [kind, id] = cardId.split(":");
  const type = audio.type || "audio/mp4";
  const path = `${kind}/${id}/${Date.now()}.${extension(type)}`;
  const storage = db().storage.from(BUCKET);

  const up = await storage.upload(path, audio, { contentType: type, cacheControl: "31536000", upsert: false });
  if (up.error) throw up.error;
  const before = await db().from("teacher_recordings").select("path").eq("card_id", cardId).maybeSingle();
  const row = await db().from("teacher_recordings").upsert({ card_id: cardId, path, updated_at: new Date().toISOString() });
  if (row.error) {
    await storage.remove([path]);
    throw row.error;
  }
  if (before.data?.path && before.data.path !== path) await storage.remove([before.data.path]);
  return storage.getPublicUrl(path).data.publicUrl;
}

export async function deleteRecording(cardId: string) {
  const { data, error } = await db().from("teacher_recordings").delete().eq("card_id", cardId).select("path");
  if (error) throw error;
  const paths = (data ?? []).map((r: { path: string }) => r.path);
  if (paths.length) await db().storage.from(BUCKET).remove(paths);
}

export async function addCard(card: TeacherCard) {
  const { error } = await db().from("teacher_cards").insert({
    card_id: card.cardId,
    unit: card.unit,
    ipa: card.ipa,
    spelling: card.spelling ?? null,
    text: card.text ?? null,
    words: card.words?.length ? card.words : null,
    require_stress: card.requireStress ?? false,
  });
  if (error) throw error;
}

// Only cards added in teacher mode can be deleted here; the rest live in src/content/.
export async function deleteCard(cardId: string) {
  await deleteRecording(cardId);
  const { error } = await db().from("teacher_cards").delete().eq("card_id", cardId);
  if (error) throw error;
}

export { staticIds };
