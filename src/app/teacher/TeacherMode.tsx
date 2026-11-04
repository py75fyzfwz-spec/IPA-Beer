"use client";

import { useCallback, useEffect, useState } from "react";
import { allCards, units } from "@/content";
import type { StudyCard } from "@/content/types";
import { mergeTeacherContent, type TeacherCard, type TeacherContent } from "@/lib/teacherContent";
import type { SetupCheck } from "@/lib/teacherStore";
import { AddCard } from "./AddCard";
import { RecordCards } from "./RecordCards";

type Session =
  | { status: "loading" }
  | { status: "signed-out"; configured: { passcode: boolean; storage: boolean } }
  | { status: "ready" };

type Tab = "record" | "add";

// Teacher mode: go through a unit's cards and record each one, or add new
// cards. Everything is saved to the site straight away (in Supabase).
export function TeacherMode() {
  const [session, setSession] = useState<Session>({ status: "loading" });
  const [content, setContent] = useState<TeacherContent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("record");
  const [unit, setUnit] = useState(units[0].number);
  const [jumpTo, setJumpTo] = useState<string | null>(null);
  const [setup, setSetup] = useState<SetupCheck[] | null>(null);

  // Check every step a save needs, so a setup problem shows up front
  // instead of as recordings that quietly fail to save.
  const checkSetup = useCallback(async () => {
    setSetup(null);
    const r = await fetch("/api/teacher/setup", { cache: "no-store" }).catch(() => null);
    if (r?.ok) setSetup(await r.json());
  }, []);

  const loadContent = useCallback(async () => {
    const r = await fetch("/api/teacher/content", { cache: "no-store" });
    const body = await r.json().catch(() => ({}));
    if (r.status === 401) {
      setSession({ status: "signed-out", configured: { passcode: true, storage: true } });
      return;
    }
    if (!r.ok) {
      setLoadError(body.error ?? "Couldn't load teacher mode");
      return;
    }
    setLoadError(null);
    setContent(body as TeacherContent);
    checkSetup();
  }, [checkSetup]);

  useEffect(() => {
    // Remember the last unit, so the teacher picks up where they left off.
    try {
      const saved = Number(localStorage.getItem("ipa.teacher.unit"));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (units.some((u) => u.number === saved)) setUnit(saved);
    } catch {}
    fetch("/api/teacher/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((s: { signedIn: boolean; configured: { passcode: boolean; storage: boolean } }) => {
        if (s.signedIn && s.configured.storage) {
          setSession({ status: "ready" });
          loadContent();
        } else {
          setSession({ status: "signed-out", configured: s.configured });
        }
      })
      .catch(() => setLoadError("Couldn't reach the site's server"));
  }, [loadContent]);

  function chooseUnit(n: number) {
    setUnit(n);
    try {
      localStorage.setItem("ipa.teacher.unit", String(n));
    } catch {}
  }

  async function signOut() {
    await fetch("/api/teacher/session", { method: "DELETE" });
    setContent(null);
    setSession({ status: "signed-out", configured: { passcode: true, storage: true } });
  }

  if (loadError && !content) {
    return (
      <p role="alert" className="rounded-md border border-again px-3 py-2 text-again">
        {loadError}
      </p>
    );
  }
  if (session.status === "loading") return <p className="text-muted">Loading teacher mode…</p>;
  if (session.status === "signed-out") {
    return (
      <SignIn
        configured={session.configured}
        onSignedIn={() => {
          setSession({ status: "ready" });
          loadContent();
        }}
      />
    );
  }
  if (!content) return <p className="text-muted">Loading the cards…</p>;

  const cards: StudyCard[] = mergeTeacherContent(allCards, content).filter((c) => c.kind !== "dictation");
  const added = new Set(content.cards.map((c) => c.cardId));
  const builtInAudio = new Set(allCards.flatMap((c) => (c.kind !== "dictation" && audioOf(c) ? [c.id] : [])));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">Teacher mode</h1>
        <button type="button" onClick={signOut} className="text-sm text-muted underline">
          Sign out
        </button>
      </div>

      {setup && setup.some((c) => !c.ok) && <SetupProblems checks={setup} onRecheck={checkSetup} />}

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">Unit</span>
          <select
            value={unit}
            onChange={(e) => chooseUnit(Number(e.target.value))}
            className="max-w-[16rem] rounded-md border border-line bg-surface px-2 py-1.5"
          >
            {units.map((u) => (
              <option key={u.number} value={u.number}>
                {u.number}. {u.title}
              </option>
            ))}
          </select>
        </label>
        <div role="tablist" className="flex rounded-full border border-line bg-surface p-0.5 text-sm">
          {(["record", "add"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 font-medium ${tab === t ? "bg-accent text-paper" : "text-muted"}`}
            >
              {t === "record" ? "Record" : "Add cards"}
            </button>
          ))}
        </div>
      </div>

      {tab === "record" ? (
        <RecordCards
          key={unit}
          unit={unit}
          cards={cards}
          recordings={content.recordings}
          builtInAudio={builtInAudio}
          added={added}
          jumpTo={jumpTo}
          onJumped={() => setJumpTo(null)}
          onSaved={(cardId, url) =>
            setContent((c) => c && { ...c, recordings: { ...c.recordings, [cardId]: url } })
          }
          onDeleted={(cardId) =>
            setContent((c) => {
              if (!c) return c;
              const recordings = { ...c.recordings };
              delete recordings[cardId];
              return { ...c, recordings };
            })
          }
        />
      ) : (
        <AddCard
          unit={unit}
          addedCards={content.cards}
          onAdded={(card: TeacherCard) => setContent((c) => c && { ...c, cards: [...c.cards, card] })}
          onDeleted={(cardId) =>
            setContent((c) => {
              if (!c) return c;
              const recordings = { ...c.recordings };
              delete recordings[cardId];
              return { cards: c.cards.filter((x) => x.cardId !== cardId), recordings };
            })
          }
          onRecord={(card) => {
            chooseUnit(card.unit);
            setJumpTo(card.cardId);
            setTab("record");
          }}
        />
      )}
    </div>
  );
}

function SetupProblems({ checks, onRecheck }: { checks: SetupCheck[]; onRecheck: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-xl border border-again bg-surface p-5">
      <h2 className="font-bold text-again">Recordings and new cards can&apos;t be saved yet</h2>
      <ul className="flex flex-col gap-1.5 text-sm">
        {checks.map((c) => (
          <li key={c.name} className={c.ok ? "text-muted" : "text-ink"}>
            <span className={c.ok ? "text-good" : "font-bold text-again"}>{c.ok ? "✓" : "✗"}</span> {c.name}: {c.detail}
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted">
        After changing a setting in Vercel, redeploy the site, then check again.
      </p>
      <button type="button" onClick={onRecheck} className="self-start rounded-full border border-line px-4 py-1.5 text-sm font-medium">
        Check again
      </button>
    </div>
  );
}

export function audioOf(card: StudyCard) {
  return card.kind === "sound" ? card.sound.audio : card.kind === "sentence" ? card.sentence.audio : card.word.audio;
}

function SignIn({
  configured,
  onSignedIn,
}: {
  configured: { passcode: boolean; storage: boolean };
  onSignedIn: () => void;
}) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!configured.passcode || !configured.storage) {
    return (
      <div className="flex max-w-prose flex-col gap-3 rounded-xl border border-line bg-surface p-6">
        <h1 className="text-xl font-bold">Teacher mode isn&apos;t set up yet</h1>
        <p className="text-muted">
          In the Vercel project&apos;s environment variables, add
          {!configured.passcode && (
            <>
              {" "}
              <code>TEACHER_PASSCODE</code>
            </>
          )}
          {!configured.passcode && !configured.storage && " and"}
          {!configured.storage && (
            <>
              {" "}
              <code>SUPABASE_URL</code> and <code>SUPABASE_SECRET_KEY</code>
            </>
          )}
          , then redeploy. The README explains each step.
        </p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await fetch("/api/teacher/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    }).catch(() => null);
    setBusy(false);
    if (r?.ok) onSignedIn();
    else setError(r?.status === 401 ? "That passcode isn't right." : "Couldn't sign in. Try again.");
  }

  return (
    <form onSubmit={submit} className="flex max-w-sm flex-col gap-3 rounded-xl border border-line bg-surface p-6">
      <h1 className="text-xl font-bold">Teacher mode</h1>
      <p className="text-sm text-muted">Record the cards and add new ones. Enter the teacher passcode to continue.</p>
      <input
        type="password"
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
        autoComplete="current-password"
        aria-label="Passcode"
        className="rounded-md border border-line bg-paper px-3 py-2"
        autoFocus
      />
      {error && (
        <p role="alert" className="text-sm text-again">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || !passcode}
        className="rounded-full bg-accent px-6 py-2.5 font-medium text-paper disabled:opacity-50"
      >
        {busy ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}
