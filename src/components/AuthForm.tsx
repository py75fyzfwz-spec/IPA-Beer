"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "forgot";

const titles: Record<Mode, string> = {
  login: "Log in",
  signup: "Create an account",
  forgot: "Reset your password",
};

const inputClass = "rounded-md border border-line bg-surface px-3 py-2 text-base";

export function AuthForm({ mode: initialMode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const supabase = createClient();
    const callback = (next: string) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const next = new URLSearchParams(window.location.search).get("next");
        router.replace(next?.startsWith("/") && !next.startsWith("//") ? next : "/study");
        router.refresh();
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: callback("/study") },
        });
        if (error) throw error;
        if (data.session) {
          router.replace("/study");
          router.refresh();
        } else {
          setNotice("Check your email and click the link to confirm your account.");
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: callback("/reset-password"),
        });
        if (error) throw error;
        setNotice("If that email has an account, a reset link is on its way.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-2xl font-bold">{titles[mode]}</h1>

      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </label>

      {mode !== "forgot" && (
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          {mode === "signup" && <span className="text-muted">At least 8 characters.</span>}
        </label>
      )}

      {error && <p className="text-sm text-again" role="alert">{error}</p>}
      {notice && <p className="text-sm text-good" role="status">{notice}</p>}

      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-accent px-5 py-2.5 font-medium text-paper disabled:opacity-60"
      >
        {busy ? "Please wait…" : titles[mode]}
      </button>

      <div className="flex flex-col gap-1 text-sm text-muted">
        {mode === "login" && (
          <>
            <button type="button" className="text-left underline" onClick={() => setMode("forgot")}>
              Forgot your password?
            </button>
            <span>
              New here? <Link href="/signup" className="underline">Create an account</Link>
            </span>
          </>
        )}
        {mode === "signup" && (
          <span>
            Already have an account? <Link href="/login" className="underline">Log in</Link>
          </span>
        )}
        {mode === "forgot" && (
          <button type="button" className="text-left underline" onClick={() => setMode("login")}>
            Back to log in
          </button>
        )}
      </div>
    </form>
  );
}
