import { isTeacher } from "./teacherAuth";
import { storageConfigured } from "./teacherStore";

// For teacher-mode API routes: a response to send back, or null to go on.
export async function teacherGuard() {
  if (!(await isTeacher())) return Response.json({ error: "Sign in to teacher mode first" }, { status: 401 });
  if (!storageConfigured()) return Response.json({ error: "Supabase isn't set up for this site yet" }, { status: 503 });
  return null;
}
