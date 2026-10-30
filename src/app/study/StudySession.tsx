"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Card, Grade } from "ts-fsrs";
import type { StudyCard } from "@/content/types";
import { loadProgress, saveReview } from "@/lib/progress";
import { buildQueue, newCard, RELEARN_WINDOW_MS, scheduler } from "@/lib/srs";
import { createClient } from "@/lib/supabase/client";
import { CardView } from "./CardView";

type Session =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; userId: string; states: Map<string, Card>; queue: StudyCard[]; newLeft: number; done: number };

const EXTRA_NEW = 5;

export function StudySession() {
  const [session, setSession] = useState<Session>({ status: "loading" });
  const [revealed, setRevealed] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Created here, not during render, so building the site needs no keys.
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (!data.user) throw new Error("You're not logged in.");
        const progress = await loadProgress(supabase);
        const now = new Date();
        const newLeft = Math.max(0, progress.newPerDay - progress.newToday);
        const queue = buildQueue(progress.states, newLeft, now);
        setSession({ status: "ready", userId: data.user.id, states: progress.states, queue, newLeft, done: 0 });
      } catch (err) {
        setSession({ status: "error", message: err instanceof Error ? err.message : "Couldn't load your progress." });
      }
    })();
  }, []);

  const current = session.status === "ready" ? session.queue[0] : undefined;

  const rate = useCallback(
    (grade: Grade) => {
      if (session.status !== "ready" || !current) return;
      const now = new Date();
      const before = session.states.get(current.id) ?? newCard(now);
      const result = scheduler.next(before, now, grade);

      const states = new Map(session.states).set(current.id, result.card);
      const rest = session.queue.slice(1);
      // Cards in a short learning step come back a few cards later.
      if (result.card.due.getTime() - now.getTime() < RELEARN_WINDOW_MS) {
        rest.splice(Math.min(3, rest.length), 0, current);
      }
      setSession({ ...session, states, queue: rest, done: session.done + 1 });
      setRevealed(false);

      saveReview(createClient(), session.userId, current.id, grade, result).catch(() => setSaveError(true));
    },
    [session, current],
  );

  // Space or Enter checks, 1 to 4 rate. Dictation cards use their own form.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current || current.kind === "dictation") return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!revealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && ["1", "2", "3", "4"].includes(e.key)) {
        rate(Number(e.key) as Grade);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, revealed, rate]);

  if (session.status === "loading") {
    return <p className="text-muted">Loading your cards…</p>;
  }

  if (session.status === "error") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-again" role="alert">{session.message}</p>
        <Link href="/login" className="underline">Log in again</Link>
      </div>
    );
  }

  const learnMore = () => {
    const queue = buildQueue(session.states, EXTRA_NEW, new Date());
    setSession({ ...session, queue });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{session.queue.length} left in this session</span>
        <span>{session.done} done</span>
      </div>

      {saveError && (
        <p className="rounded-md border border-again px-3 py-2 text-sm text-again" role="alert">
          Some answers couldn&apos;t be saved. Check your connection; cards you rate now are still scheduled on this
          device until you reload.
        </p>
      )}

      {current ? (
        <CardView
          key={`${current.id}-${session.done}`}
          card={current}
          state={session.states.get(current.id) ?? newCard(new Date())}
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          onRate={rate}
        />
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-line bg-surface p-6">
          <h2 className="text-xl font-bold">All done for now</h2>
          <p className="text-muted">
            {session.done > 0
              ? `You reviewed ${session.done} cards. Come back tomorrow for the next ones.`
              : "Nothing is due right now."}
          </p>
          <button type="button" onClick={learnMore} className="rounded-full border border-line px-4 py-2 text-sm font-medium">
            Learn {EXTRA_NEW} more new cards
          </button>
        </div>
      )}
    </div>
  );
}

