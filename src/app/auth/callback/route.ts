import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Supabase email links (sign-up confirmation, password reset) land here
// with a one-time code, which is swapped for a session cookie.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next") ?? "/study";
  // Only allow redirects within this site.
  const target = new URL(next.startsWith("/") && !next.startsWith("//") ? next : "/study", request.url);

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=link", request.url));
  }

  const response = NextResponse.redirect(target);
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=link", request.url));
  }
  return response;
}
