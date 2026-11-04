import { teacherGuard } from "@/lib/teacherGuard";
import { loadTeacherContent } from "@/lib/teacherStore";

// Teacher mode's own copy of the added cards and recordings: never cached.
export async function GET() {
  const denied = await teacherGuard();
  if (denied) return denied;
  try {
    return Response.json(await loadTeacherContent(), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("Loading teacher content failed", e);
    return Response.json({ error: "Couldn't reach Supabase. Has supabase/teacher-mode.sql been run?" }, { status: 502 });
  }
}
