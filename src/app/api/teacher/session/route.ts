import { isTeacher, passcodeMatches, signIn, signOut, teacherModeConfigured } from "@/lib/teacherAuth";

// GET: is this browser signed in to teacher mode, and is the site set up for it?
export async function GET() {
  return Response.json({ signedIn: await isTeacher(), configured: teacherModeConfigured() });
}

// POST { passcode }: sign in.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const attempt = typeof body?.passcode === "string" ? body.passcode : "";
  if (!passcodeMatches(attempt)) {
    // Slow down guessing.
    await new Promise((r) => setTimeout(r, 1000));
    return Response.json({ error: "Wrong passcode" }, { status: 401 });
  }
  await signIn();
  return Response.json({ signedIn: true });
}

// DELETE: sign out.
export async function DELETE() {
  await signOut();
  return Response.json({ signedIn: false });
}
