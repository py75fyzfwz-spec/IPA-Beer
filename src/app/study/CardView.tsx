"use client";

import { useRef, useState } from "react";
import { Rating, type Card, type Grade } from "ts-fsrs";
import { Ipa } from "@/components/Ipa";
import { IpaKeyboard } from "@/components/IpaKeyboard";
import { PlayButton } from "@/components/PlayButton";
import { RatingButtons } from "@/components/RatingButtons";
import { sounds } from "@/content";
import type { StudyCard } from "@/content/types";
import { checkDictation, tokenize, type CheckResult } from "@/lib/ipa";

type Props = {
  card: StudyCard;
  state: Card;
  revealed: boolean;
  onReveal: () => void;
  onRate: (grade: Grade) => void;
};

const label: Record<StudyCard["kind"], string> = {
  sound: "Sound",
  word: "Word",
  sentence: "Sentence",
  dictation: "Dictation",
};

export function CardView(props: Props) {
  const { card } = props;
  return (
    <article className="flex flex-col gap-6 rounded-xl border border-line bg-surface p-5 sm:p-8">
      <span className="text-xs tracking-wide text-muted uppercase">{label[card.kind]}</span>
      {card.kind === "dictation" ? <DictationCard {...props} card={card} /> : <ReadingCard {...props} />}
    </article>
  );
}

// Sound, word and sentence cards: read it aloud, then check with the recording.
function ReadingCard({ card, state, revealed, onReveal, onRate }: Props) {
  const ipa = card.kind === "sound" ? card.sound.ipa : card.kind === "word" ? card.word.ipa : card.kind === "sentence" ? card.sentence.ipa : "";
  const audio = card.kind === "sound" ? card.sound.audio : card.kind === "word" ? card.word.audio : card.kind === "sentence" ? card.sentence.audio : undefined;

  return (
    <>
      <div className="flex min-h-32 items-center justify-center text-center">
        <Ipa size={card.kind === "sentence" ? "lg" : "xl"}>{ipa}</Ipa>
      </div>

      {!revealed ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-muted">Read it aloud, then check.</p>
          <button type="button" onClick={onReveal} className="rounded-full bg-accent px-6 py-2.5 font-medium text-paper">
            Check <span className="opacity-70">(space)</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex justify-center">
            <PlayButton audio={audio} autoPlay />
          </div>
          {card.kind === "sound" ? (
            <div className="flex flex-col gap-1 text-center">
              <p>As in {card.sound.keyWords.join(", ")}</p>
              <p className="text-sm text-muted">{card.sound.tip}</p>
            </div>
          ) : (
            <SoundTips ipa={ipa} />
          )}
          <p className="text-center text-sm text-muted">How well did you read it?</p>
          <RatingButtons card={state} onRate={onRate} />
        </div>
      )}
    </>
  );
}

// Tap a symbol in the transcription for its tip.
function SoundTips({ ipa }: { ipa: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const inWord = sounds.filter((s) => tokenize(ipa).includes(s.ipa));
  const tip = inWord.find((s) => s.ipa === open);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap justify-center gap-1.5">
        {inWord.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setOpen(open === s.ipa ? null : s.ipa)}
            aria-pressed={open === s.ipa}
            className={`rounded-md border px-2 py-0.5 font-ipa text-lg ${open === s.ipa ? "border-accent bg-accent-soft" : "border-line"}`}
          >
            {s.ipa}
          </button>
        ))}
      </div>
      {tip && (
        <p className="max-w-prose text-center text-sm text-muted">
          <span className="font-ipa text-base text-ink">{tip.ipa}</span> as in {tip.keyWords.join(", ")}. {tip.tip}
        </p>
      )}
    </div>
  );
}

// Hear the word, type it in IPA, and see which symbols were off.
function DictationCard({ card, state, onRate }: Props & { card: Extract<StudyCard, { kind: "dictation" }> }) {
  const input = useRef<HTMLInputElement>(null);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const requireStress = card.word.requireStress ?? false;

  function insert(symbol: string) {
    const el = input.current;
    const start = el?.selectionStart ?? typed.length;
    const end = el?.selectionEnd ?? typed.length;
    const next = typed.slice(0, start) + symbol + typed.slice(end);
    setTyped(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + symbol.length, start + symbol.length);
    });
  }

  function backspace() {
    const el = input.current;
    const start = el?.selectionStart ?? typed.length;
    const end = el?.selectionEnd ?? typed.length;
    if (start === end && start === 0) return;
    const from = start === end ? start - 1 : start;
    setTyped(typed.slice(0, from) + typed.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(from, from);
    });
  }

  function check(e: React.FormEvent) {
    e.preventDefault();
    setResult(checkDictation(typed, card.word.ipa, requireStress));
  }

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <PlayButton audio={card.word.audio} autoPlay label="Play again" />
        <p className="text-sm text-muted">
          Type what you hear in IPA{requireStress ? ", with stress marks" : ""}.
        </p>
      </div>

      <form onSubmit={check} className="flex flex-col gap-3">
        <input
          id="dictation"
          ref={input}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          readOnly={result !== null}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Your transcription"
          className="rounded-md border border-line bg-paper px-3 py-2 text-center font-ipa text-3xl"
        />
        {result === null && (
          <>
            <IpaKeyboard onKey={insert} onBackspace={backspace} />
            <button type="submit" className="self-center rounded-full bg-accent px-6 py-2.5 font-medium text-paper">
              Check
            </button>
          </>
        )}
      </form>

      {result && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-1">
            <p className={`font-bold ${result.correct ? "text-good" : "text-again"}`}>
              {result.correct ? "Correct" : "Not quite"}
            </p>
            {!result.correct && (
              <>
                <p className="font-ipa text-3xl" aria-label="Your answer compared with the correct one">
                  {result.parts.map((p, i) => (
                    <span
                      key={i}
                      className={
                        p.status === "ok" ? "" : p.status === "wrong" ? "text-again line-through" : "text-good underline"
                      }
                    >
                      {p.token}
                    </span>
                  ))}
                </p>
                <p className="text-sm text-muted">
                  Correct: <Ipa size="sm">{card.word.ipa}</Ipa>. Struck through: extra or wrong. Underlined: missing.
                </p>
              </>
            )}
          </div>
          <RatingButtons
            card={state}
            onRate={onRate}
            only={result.correct ? [Rating.Hard, Rating.Good, Rating.Easy] : [Rating.Again]}
          />
        </div>
      )}
    </>
  );
}
