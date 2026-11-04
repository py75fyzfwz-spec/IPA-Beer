import { teacherGuard } from "@/lib/teacherGuard";
import { checkSetup } from "@/lib/teacherStore";

// Teacher mode only: checks every step a save needs, with a real test write.
export async function GET() {
  const denied = await teacherGuard();
  if (denied) return denied;
  return Response.json(await checkSetup(), { headers: { "Cache-Control": "no-store" } });
}
