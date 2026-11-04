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

// Pasted values often carry spaces, quotes or the "/rest/v1" API path.
const supabaseUrl = () =>
  (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\/+$/, "")
    .replace(/\/(rest|storage)\/v1$/, "") || undefined;
const secretKey = () =>
  (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim().replace(/^["']|["']$/g, "") ||
  undefined;

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

// What went wrong, in words the teacher can act on. Teacher mode only.
export function describeError(e: unknown): string {
  const err = e as { message?: string; code?: string; statusCode?: string | number; status?: number } | null;
  const message = err?.message ?? String(e);
  const code = String(err?.code ?? err?.statusCode ?? err?.status ?? "");
  if (/row-level security|new row violates|42501|permission denied|Unauthorized|403/i.test(message + code)) {
    return `Supabase refused the save (${message}). SUPABASE_SECRET_KEY is probably the public (anon or publishable) key instead of the secret one.`;
  }
  if (/relation .* does not exist|Could not find the table|PGRST205|42P01/i.test(message + code)) {
    return `The teacher-mode tables are missing in Supabase (${message}). Run supabase/teacher-mode.sql in the SQL Editor.`;
  }
  if (/Bucket not found/i.test(message)) {
    return "The teacher-recordings bucket is missing in Supabase. Run supabase/teacher-mode.sql in the SQL Editor.";
  }
  if (/fetch failed|ENOTFOUND|Invalid URL|ECONNREFUSED/i.test(message)) {
    return `Couldn't reach Supabase (${message}). Check SUPABASE_URL: it should look like https://abcdefgh.supabase.co.`;
  }
  return message;
}

export type SetupCheck = { name: string; ok: boolean; detail: string };

// The kind of key in SUPABASE_SECRET_KEY: new-style keys say so in their
// prefix; legacy keys are JWTs whose "role" claim says anon or service_role.
function keyKind(key: string): "secret" | "public" | "unknown" {
  if (key.startsWith("sb_secret_")) return "secret";
  if (key.startsWith("sb_publishable_")) return "public";
  try {
    const payload = JSON.parse(Buffer.from(key.split(".")[1] ?? "", "base64url").toString("utf8"));
    if (payload.role === "service_role") return "secret";
    if (payload.role === "anon" || payload.role === "authenticated") return "public";
  } catch {}
  return "unknown";
}

// Run every step a save needs, including a real test write that is
// removed again, and report each one. Teacher mode shows the result.
export async function checkSetup(): Promise<SetupCheck[]> {
  const checks: SetupCheck[] = [];
  const add = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail });
  const url = supabaseUrl() ?? "";
  const key = secretKey() ?? "";

  add(
    "Supabase address",
    /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/.test(url),
    url ? `SUPABASE_URL is ${url}` : "SUPABASE_URL is missing",
  );
  const kind = keyKind(key);
  add(
    "Secret key",
    kind !== "public",
    kind === "public"
      ? "SUPABASE_SECRET_KEY holds the public (anon or publishable) key. Use the secret key (sb_secret_…) or the service_role key from Supabase → Project Settings → API Keys."
      : kind === "secret"
        ? "SUPABASE_SECRET_KEY is a secret key"
        : "Couldn't tell what kind of key SUPABASE_SECRET_KEY is; the checks below show whether it works",
  );

  try {
    for (const table of ["teacher_cards", "teacher_recordings"]) {
      const { error } = await db().from(table).select("card_id").limit(1);
      add(`Table ${table}`, !error, error ? describeError(error) : "found");
    }

    const bucket = await db().storage.getBucket(BUCKET);
    add(
      "Recordings bucket",
      !bucket.error && bucket.data?.public === true,
      bucket.error
        ? kind === "public"
          ? "Can't be checked with the public key. Fix the secret key first."
          : describeError(bucket.error)
        : bucket.data?.public
          ? "found, public"
          : "The teacher-recordings bucket is private, so learners can't play the files. Run supabase/teacher-mode.sql again, or make the bucket public in Supabase → Storage.",
    );

    const path = `setup-check/${Date.now()}.txt`;
    const up = await db().storage.from(BUCKET).upload(path, new Blob(["ok"], { type: "text/plain" }));
    if (!up.error) await db().storage.from(BUCKET).remove([path]);
    add("Saving a file", !up.error, up.error ? describeError(up.error) : "a test file was saved and removed");

    const row = await db().from("teacher_recordings").upsert({ card_id: "__setup_check__", path });
    if (!row.error) await db().from("teacher_recordings").delete().eq("card_id", "__setup_check__");
    add("Saving to the table", !row.error, row.error ? describeError(row.error) : "a test row was saved and removed");
  } catch (e) {
    add("Connecting to Supabase", false, describeError(e));
  }
  return checks;
}
