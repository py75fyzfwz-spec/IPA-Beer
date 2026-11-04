"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Ipa } from "@/components/Ipa";
import { unitOf } from "@/content";
import type { StudyCard } from "@/content/types";
import { audioOf } from "./TeacherMode";
import { useRecorder } from "./useRecorder";

type Props = {
  unit: number;
  cards: StudyCard[]; // every recordable card, all units
  recordings: Record<string, string>; // made in teacher mode
  builtInAudio: Set<string>; // cards whose audio is in the site's files
  added: Set<string>; // cards added in teacher mode
  jumpTo: string | null;
  onJumped: () => void;
  onSaved: (cardId: string, url: string) => void;
  onDeleted: (cardId: string) => void;
};

type Upload = { state: "saving" | "failed"; blob: Blob };

const kindLabel = { sound: "Sound", word: "Word", sentence: "Sentence", dictation: "Dictation" };

// Step through a unit's cards: record, listen back, save and go on.
// Saving happens in the background, so the next card is ready at once.
export function RecordCards({ unit, cards, recordings, builtInAudio, added, jumpTo, onJumped, onSaved, onDeleted }: Props) {
  const unitCards = useMemo(() => cards.filter((c) => unitOf(c) === unit), [cards, unit]);
  const [index, setIndex] = useState(() => {
    const first = unitCards.findIndex((c) => !recordings[c.id] && !builtInAudio.has(c.id));
    return first === -1 ? 0 : first;
  });
  const [take, setTake] = useState<{ cardId: string; blob: Blob; url: string } | null>(null);
  const [uploads, setUploads] = useState<Record<string, Upload>>({});
  const [message, setMessage] = useState<string | null>(null);
  const recorder = useRecorder(30);
  const player = useRef<HTMLAudioElement | null>(null);

  const card = unitCards[Math.min(index, unitCards.length - 1)];
  const hasRecording = (id: string) => Boolean(recordings[id]) || builtInAudio.has(id) || uploads[id]?.state === "saving";
  const done = unitCards.filter((c) => hasRecording(c.id)).length;

  // "Record it now" after adding a card.
  useEffect(() => {
    if (!jumpTo) return;
    const i = unitCards.findIndex((c) => c.id === jumpTo);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (i !== -1) setIndex(i);
    onJumped();
  }, [jumpTo, unitCards, onJumped]);

  // A take belongs to one card; moving on throws it away unless it was saved.
  useEffect(() => () => {
    if (take) URL.revokeObjectURL(take.url);
  }, [take]);

  useEffect(() => () => player.current?.pause(), []);

  const play = useCallback((src: string) => {
    player.current?.pause();
    const el = new Audio(src);
    player.current = el;
    el.play().catch(() => {});
  }, []);

  const go = useCallback(
    (to: number) => {
      recorder.stop();
      player.current?.pause();
      setTake(null);
      setMessage(null);
      setIndex(Math.max(0, Math.min(unitCards.length - 1, to)));
    },
    [recorder, unitCards.length],
  );

  const upload = useCallback(
    async (cardId: string, blob: Blob) => {
      setUploads((u) => ({ ...u, [cardId]: { state: "saving", blob } }));
      const form = new FormData();
      form.set("cardId", cardId);
      form.set("audio", blob, `take.${blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm"}`);
      const r = await fetch("/api/teacher/recordings", { method: "POST", body: form }).catch(() => null);
      const body = r ? await r.json().catch(() => ({})) : {};
      if (r?.ok && body.url) {
        onSaved(cardId, body.url);
        setUploads((u) => {
          const next = { ...u };
          delete next[cardId];
          return next;
        });
      } else {
        setUploads((u) => ({ ...u, [cardId]: { state: "failed", blob } }));
        setMessage(body.error ?? "A recording couldn't be saved. Check the connection and press Retry.");
      }
    },
    [onSaved],
  );

  const toggleRecord = useCallback(() => {
    if (!card) return;
    if (recorder.recording) {
      recorder.stop();
      return;
    }
    player.current?.pause();
    setTake(null);
    const cardId = card.id;
    recorder.start((blob) => setTake({ cardId, blob, url: URL.createObjectURL(blob) }));
  }, [card, recorder]);

  const saveAndNext = useCallback(() => {
    if (!take || !card || take.cardId !== card.id) return;
    upload(take.cardId, take.blob);
    // Next card without a recording, or simply the next one.
    const nextMissing = unitCards.findIndex((c, i) => i > index && !hasRecording(c.id));
    go(nextMissing === -1 ? index + 1 : nextMissing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [take, card, upload, unitCards, index, go]);

  async function remove() {
    if (!card || !confirm("Delete the teacher-mode recording for this card?")) return;
    const r = await fetch(`/api/teacher/recordings?cardId=${encodeURIComponent(card.id)}`, { method: "DELETE" }).catch(() => null);
    if (r?.ok) onDeleted(card.id);
    else setMessage("Couldn't delete the recording.");
  }

  // Space: record / stop. Enter: save and next. P: play the take. ← →: move.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === " ") {
        e.preventDefault();
        toggleRecord();
      } else if (e.key === "Enter" && take && !recorder.recording) {
        e.preventDefault();
        saveAndNext();
      } else if ((e.key === "p" || e.key === "P") && take) {
        play(take.url);
      } else if (e.key === "ArrowRight") {
        go(index + 1);
      } else if (e.key === "ArrowLeft") {
        go(index - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleRecord, saveAndNext, play, go, take, index, recorder.recording]);

  if (!card) {
    return (
      <p className="rounded-xl border border-line bg-surface p-6 text-muted">
        This unit has no cards yet. Add some under Add cards.
      </p>
    );
  }

  const ipa = card.kind === "sound" ? card.sound.ipa : card.kind === "sentence" ? card.sentence.ipa : card.word.ipa;
  const answer =
    card.kind === "sound" ? `as in ${card.sound.keyWords.join(", ")}` : card.kind === "sentence" ? card.sentence.text : card.word.spelling;
  const current = audioOf(card);
  const failed = Object.entries(uploads).filter(([, u]) => u.state === "failed");
  const thisTake = take?.cardId === card.id ? take : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          Card {index + 1} of {unitCards.length}
        </span>
        <span>
          {done} of {unitCards.length} recorded
        </span>
      </div>

      {failed.length > 0 && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-md border border-again px-3 py-2 text-sm text-again">
          <span>
            {failed.length === 1 ? "1 recording wasn't saved." : `${failed.length} recordings weren't saved.`}
          </span>
          <button
            type="button"
            onClick={() => failed.forEach(([id, u]) => upload(id, u.blob))}
            className="rounded-full border border-again px-3 py-1 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      <article className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-5 sm:p-8">
        <div className="flex items-center justify-between">
          <span className="text-xs tracking-wide text-muted uppercase">
            {kindLabel[card.kind]}
            {added.has(card.id) && " · added in teacher mode"}
          </span>
          <RecordingState
            saving={uploads[card.id]?.state === "saving"}
            teacherMode={Boolean(recordings[card.id])}
            builtIn={builtInAudio.has(card.id)}
          />
        </div>
        <div className="flex min-h-28 flex-col items-center justify-center gap-3 text-center">
          <Ipa size={card.kind === "sentence" ? "lg" : "xl"}>{ipa}</Ipa>
          {answer && <p className="text-xl font-medium">{answer}</p>}
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={toggleRecord}
            disabled={recorder.status === "unsupported" || recorder.status === "starting"}
            className={`flex items-center gap-2 rounded-full px-7 py-3 text-lg font-medium text-paper disabled:opacity-50 ${
              recorder.recording ? "bg-again" : "bg-accent"
            }`}
          >
            <span aria-hidden>{recorder.recording ? "■" : "●"}</span>
            {recorder.recording ? `Stop (${recorder.seconds}s)` : thisTake ? "Record again" : "Record"}
            <span className="hidden text-sm opacity-70 sm:inline">(space)</span>
          </button>
          <RecorderHint status={recorder.status} />

          {thisTake && !recorder.recording && (
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => play(thisTake.url)}
                className="rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-accent"
              >
                ▶ Listen <span className="hidden text-muted sm:inline">(P)</span>
              </button>
              <button type="button" onClick={saveAndNext} className="rounded-full bg-good px-5 py-2 text-sm font-medium text-paper">
                Save and next <span className="hidden opacity-70 sm:inline">(Enter)</span>
              </button>
            </div>
          )}

          {!thisTake && current && !recorder.recording && (
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <button
                type="button"
                onClick={() => play(current.src)}
                className="rounded-full border border-line px-4 py-2 font-medium hover:border-accent"
              >
                ▶ Current recording
              </button>
              {recordings[card.id] && (
                <button type="button" onClick={remove} className="text-muted underline">
                  Delete it
                </button>
              )}
            </div>
          )}
          {builtInAudio.has(card.id) && (
            <p className="max-w-prose text-center text-xs text-muted">
              This card already has a recording in the site&apos;s files. That one is played to learners, so a new take
              here only counts once the file is removed.
            </p>
          )}
        </div>

        <div className="flex justify-between text-sm">
          <button type="button" onClick={() => go(index - 1)} disabled={index === 0} className="text-muted underline disabled:opacity-40">
            ← Back
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            disabled={index >= unitCards.length - 1}
            className="text-muted underline disabled:opacity-40"
          >
            Skip →
          </button>
        </div>
      </article>

      {message && <p className="text-center text-sm text-again">{message}</p>}

      <ol className="flex flex-wrap gap-1.5" aria-label="Cards in this unit">
        {unitCards.map((c, i) => {
          const label = c.kind === "sound" ? c.sound.ipa : c.kind === "sentence" ? c.sentence.text ?? c.sentence.ipa : c.word.spelling ?? c.word.ipa;
          const state = uploads[c.id]?.state === "failed" ? "failed" : hasRecording(c.id) ? "done" : "todo";
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-current={i === index}
                title={label}
                className={`max-w-[12rem] truncate rounded-md border px-2 py-0.5 text-sm ${
                  i === index ? "border-accent bg-accent-soft" : "border-line"
                } ${state === "done" ? "text-good" : state === "failed" ? "text-again" : "text-muted"}`}
              >
                {state === "done" ? "✓ " : state === "failed" ? "! " : ""}
                {c.kind === "sound" ? <span className="font-ipa">{label}</span> : label}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function RecordingState({ saving, teacherMode, builtIn }: { saving: boolean; teacherMode: boolean; builtIn: boolean }) {
  const text = saving ? "Saving…" : teacherMode || builtIn ? "✓ Recorded" : "Not recorded yet";
  return <span className={`text-xs ${teacherMode || builtIn ? "text-good" : "text-muted"}`}>{text}</span>;
}

function RecorderHint({ status }: { status: string }) {
  if (status === "unsupported") return <p className="text-sm text-again">This browser can&apos;t record. Try Chrome, Safari or Firefox.</p>;
  if (status === "denied")
    return <p className="text-sm text-again">The microphone is blocked. Allow it in the browser&apos;s site settings, then try again.</p>;
  if (status === "error") return <p className="text-sm text-again">The microphone couldn&apos;t start. Check it&apos;s connected.</p>;
  if (status === "starting") return <p className="text-sm text-muted">Starting the microphone…</p>;
  return null;
}
