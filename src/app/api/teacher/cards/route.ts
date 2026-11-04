import { units } from "@/content";
import { slugify, type TeacherCard } from "@/lib/teacherContent";
import { teacherGuard } from "@/lib/teacherGuard";
import { addCard, deleteCard, loadTeacherContent, staticIds } from "@/lib/teacherStore";

// Add or delete a card made in teacher mode. Teacher mode only.

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");
// Slashes are often typed around transcriptions; the cards don't use them.
const cleanIpa = (v: unknown) => clean(v, 300).replace(/^[/[]+|[/\]]+$/g, "").trim();

// JSON { kind: "word" | "sentence", unit, ipa, spelling | text, words?, requireStress? }
export async function POST(request: Request) {
  const denied = await teacherGuard();
  if (denied) return denied;
  const body = await request.json().catch(() => null);
  const kind = body?.kind === "sentence" ? "sentence" : body?.kind === "word" ? "word" : null;
  const unit = Number(body?.unit);
  const ipa = cleanIpa(body?.ipa);
  const answer = clean(kind === "word" ? body?.spelling : body?.text, kind === "word" ? 60 : 300);

  if (!kind) return Response.json({ error: "Choose word or sentence" }, { status: 400 });
  if (!units.some((u) => u.number === unit)) return Response.json({ error: "Choose a unit" }, { status: 400 });
  if (!ipa) return Response.json({ error: "Add the IPA transcription" }, { status: 400 });
  if (!answer) return Response.json({ error: kind === "word" ? "Add the spelling" : "Add the sentence" }, { status: 400 });

  const slug = slugify(answer);
  if (!slug) return Response.json({ error: "Use at least one letter or number in the spelling" }, { status: 400 });
  const card: TeacherCard = {
    cardId: `${kind}:${slug}`,
    unit,
    ipa,
    ...(kind === "word"
      ? { spelling: answer, requireStress: body?.requireStress === true }
      : {
          text: answer,
          words: Array.isArray(body?.words) ? body.words.map((w: unknown) => slugify(String(w))).filter(Boolean).slice(0, 20) : [],
        }),
  };

  try {
    const existing = await loadTeacherContent();
    if (staticIds.has(card.cardId) || existing.cards.some((c) => c.cardId === card.cardId)) {
      return Response.json({ error: `There's already a ${kind} card for “${answer}”` }, { status: 409 });
    }
    await addCard(card);
    return Response.json(card, { status: 201 });
  } catch (e) {
    console.error("Adding a teacher card failed", e);
    return Response.json({ error: "Couldn't save the card" }, { status: 502 });
  }
}

// ?cardId=word:bread
export async function DELETE(request: Request) {
  const denied = await teacherGuard();
  if (denied) return denied;
  const cardId = new URL(request.url).searchParams.get("cardId") ?? "";
  if (staticIds.has(cardId)) {
    return Response.json({ error: "This card is part of the site's built-in content, so it can't be deleted here" }, { status: 400 });
  }
  try {
    await deleteCard(cardId);
    return Response.json({ deleted: cardId });
  } catch (e) {
    console.error("Deleting a teacher card failed", e);
    return Response.json({ error: "Couldn't delete the card" }, { status: 502 });
  }
}
