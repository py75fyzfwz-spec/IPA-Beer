import { teacherGuard } from "@/lib/teacherGuard";
import { deleteRecording, describeError, isRecordable, saveRecording } from "@/lib/teacherStore";

// Save or delete the teacher's recording for one card. Teacher mode only.

const MAX_BYTES = 4 * 1024 * 1024; // Vercel functions accept bodies up to 4.5 MB

// multipart form: cardId, audio
export async function POST(request: Request) {
  const denied = await teacherGuard();
  if (denied) return denied;
  const form = await request.formData().catch(() => null);
  const cardId = form?.get("cardId");
  const audio = form?.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0 || !audio.type.startsWith("audio/")) {
    return Response.json({ error: "No audio in the upload" }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) return Response.json({ error: "Recording is too long" }, { status: 413 });
  try {
    if (typeof cardId !== "string" || !(await isRecordable(cardId))) {
      return Response.json({ error: "Unknown card" }, { status: 400 });
    }
    return Response.json({ cardId, url: await saveRecording(cardId, audio) });
  } catch (e) {
    console.error("Saving a teacher recording failed", e);
    return Response.json({ error: `Couldn't save the recording: ${describeError(e)}` }, { status: 502 });
  }
}

// ?cardId=word:mother
export async function DELETE(request: Request) {
  const denied = await teacherGuard();
  if (denied) return denied;
  const cardId = new URL(request.url).searchParams.get("cardId") ?? "";
  try {
    await deleteRecording(cardId);
    return Response.json({ deleted: cardId });
  } catch (e) {
    console.error("Deleting a teacher recording failed", e);
    return Response.json({ error: `Couldn't delete the recording: ${describeError(e)}` }, { status: 502 });
  }
}
