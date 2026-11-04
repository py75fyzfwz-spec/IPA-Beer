"use client";

import { useRef, useState } from "react";
import { Ipa } from "@/components/Ipa";
import { IpaKeyboard } from "@/components/IpaKeyboard";
import type { TeacherCard } from "@/lib/teacherContent";

type Props = {
  unit: number;
  addedCards: TeacherCard[];
  onAdded: (card: TeacherCard) => void;
  onDeleted: (cardId: string) => void;
  onRecord: (card: TeacherCard) => void;
};

// Add a word or sentence card. It goes live for learners within about a
// minute, and can be recorded straight away.
export function AddCard({ unit, addedCards, onAdded, onDeleted, onRecord }: Props) {
  const [kind, setKind] = useState<"word" | "sentence">("word");
  const [answer, setAnswer] = useState("");
  const [ipa, setIpa] = useState("");
  const [words, setWords] = useState("");
  const [stress, setStress] = useState<boolean | null>(null); // null: follow the transcription
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<TeacherCard | null>(null);
  const ipaInput = useRef<HTMLInputElement>(null);
  const answerInput = useRef<HTMLInputElement>(null);

  // Stress marks are required in dictation when the word has more than one
  // syllable, which is when the transcription carries a stress mark.
  const requireStress = stress ?? /[ˈˌ]/.test(ipa);

  function insert(symbol: string) {
    const el = ipaInput.current;
    const start = el?.selectionStart ?? ipa.length;
    const end = el?.selectionEnd ?? ipa.length;
    setIpa(ipa.slice(0, start) + symbol + ipa.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + symbol.length, start + symbol.length);
    });
  }

  function backspace() {
    const el = ipaInput.current;
    const start = el?.selectionStart ?? ipa.length;
    const end = el?.selectionEnd ?? ipa.length;
    if (start === end && start === 0) return;
    const from = start === end ? start - 1 : start;
    setIpa(ipa.slice(0, from) + ipa.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(from, from);
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await fetch("/api/teacher/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        unit,
        ipa,
        ...(kind === "word"
          ? { spelling: answer, requireStress }
          : { text: answer, words: words.split(/[,\s]+/).filter(Boolean) }),
      }),
    }).catch(() => null);
    const body = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (!r?.ok) {
      setError(body.error ?? "Couldn't save the card. Check the connection and try again.");
      return;
    }
    onAdded(body as TeacherCard);
    setLast(body as TeacherCard);
    setAnswer("");
    setIpa("");
    setWords("");
    setStress(null);
    answerInput.current?.focus();
  }

  async function remove(card: TeacherCard) {
    const name = card.spelling ?? card.text ?? card.cardId;
    if (!confirm(`Delete the card “${name}”? Learners' progress on it is lost.`)) return;
    const r = await fetch(`/api/teacher/cards?cardId=${encodeURIComponent(card.cardId)}`, { method: "DELETE" }).catch(() => null);
    if (r?.ok) {
      onDeleted(card.cardId);
      if (last?.cardId === card.cardId) setLast(null);
    } else setError("Couldn't delete the card.");
  }

  const inUnit = addedCards.filter((c) => c.unit === unit);
  const field = "rounded-md border border-line bg-paper px-3 py-2";

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={submit} className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 sm:p-8">
        <div className="flex flex-wrap items-center gap-4">
          <fieldset className="flex gap-1 rounded-full border border-line p-0.5 text-sm">
            <legend className="sr-only">Card type</legend>
            {(["word", "sentence"] as const).map((k) => (
              <label key={k} className={`cursor-pointer rounded-full px-4 py-1.5 font-medium ${kind === k ? "bg-accent text-paper" : "text-muted"}`}>
                <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
                {k === "word" ? "Word" : "Sentence"}
              </label>
            ))}
          </fieldset>
          <span className="text-sm text-muted">Goes into unit {unit}</span>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{kind === "word" ? "Spelling" : "Sentence"}</span>
          <input
            ref={answerInput}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={kind === "word" ? "weather" : "What's the weather like?"}
            autoCapitalize="off"
            className={field}
            required
          />
          <span className="text-xs text-muted">Learners see this only after Check, as the answer.</span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">IPA transcription</span>
          <input
            ref={ipaInput}
            value={ipa}
            onChange={(e) => setIpa(e.target.value)}
            placeholder={kind === "word" ? "ˈweðə" : "ˈwɒts ðə ˈweðə laɪk"}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className={`${field} font-ipa text-2xl`}
            required
          />
          <span className="text-xs text-muted">
            EPD symbols, no slashes, with stress marks{kind === "sentence" ? " and weak forms" : ""}.
          </span>
        </label>
        <IpaKeyboard onKey={insert} onBackspace={backspace} />

        {kind === "word" ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={requireStress} onChange={(e) => setStress(e.target.checked)} />
            Learners must type the stress marks in dictation
          </label>
        ) : (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Words to learn first (optional)</span>
            <input value={words} onChange={(e) => setWords(e.target.value)} placeholder="weather, like" autoCapitalize="off" className={field} />
            <span className="text-xs text-muted">
              Word cards the sentence waits for in the daily review. Leave empty to wait for its sounds instead.
            </span>
          </label>
        )}

        {error && (
          <p role="alert" className="text-sm text-again">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="self-start rounded-full bg-accent px-6 py-2.5 font-medium text-paper disabled:opacity-50">
          {busy ? "Saving…" : "Add card"}
        </button>
      </form>

      {last && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-good px-4 py-3 text-sm">
          <span>
            Added “{last.spelling ?? last.text}” to unit {last.unit}.
          </span>
          <button type="button" onClick={() => onRecord(last)} className="rounded-full bg-good px-4 py-1.5 font-medium text-paper">
            Record it now
          </button>
        </div>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-bold">Added in teacher mode, unit {unit}</h2>
        {inUnit.length === 0 ? (
          <p className="text-sm text-muted">None yet. Cards from the class handouts are built into the site and aren&apos;t listed here.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
            {inUnit.map((c) => (
              <li key={c.cardId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
                <span className="flex min-w-0 flex-wrap items-baseline gap-x-3">
                  <span className="font-medium">{c.spelling ?? c.text}</span>
                  <Ipa size="sm">{c.ipa}</Ipa>
                </span>
                <span className="flex gap-3 text-sm">
                  <button type="button" onClick={() => onRecord(c)} className="underline">
                    Record
                  </button>
                  <button type="button" onClick={() => remove(c)} className="text-again underline">
                    Delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
