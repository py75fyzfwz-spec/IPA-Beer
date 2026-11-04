import { connection } from "next/server";
import { emptyTeacherContent } from "@/lib/teacherContent";
import { loadTeacherContent, storageConfigured } from "@/lib/teacherStore";

// Public: the cards and recordings added in teacher mode, read by the study
// page. The CDN keeps it for a minute, so what the teacher saves reaches
// learners within about a minute.
export async function GET() {
  await connection();
  if (!storageConfigured()) return Response.json(emptyTeacherContent);
  try {
    return Response.json(await loadTeacherContent(), {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=86400" },
    });
  } catch {
    return Response.json(emptyTeacherContent, { status: 502 });
  }
}
