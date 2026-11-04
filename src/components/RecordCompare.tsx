"use client";

import { useEffect, useRef, useState } from "react";
import type { Audio as AudioFile } from "@/content/types";
import { canRecord, loadRecording, pickMimeType, saveRecording } from "@/lib/myRecordings";

type Props = {
  cardId: string;
  teacher?: AudioFile;
  revealed: boolean;
};

type Status = "idle" | "starting" | "recording" | "unsupported" | "denied" | "error";
type Playing = "teacher" | "mine" | null;

const MAX_SECONDS = 30;

// Before Check: record yourself reading the card. After Check: play the
// teacher's recording and yours next to each other, or one after the other.
// Your recording stays in this browser (see lib/myRecordings.ts).
export function RecordCompare({ cardId, teacher, revealed }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [mine, setMine] = useState<string | null>(null); // object URL
  const [seconds, setSeconds] = useState(0);
  const [playing, setPlaying] = useState<Playing>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  // One element for all playback. iPhone Safari only lets an element play
  // without a tap once a tap has started it, so "teacher, then me" must
  // reuse the same element rather than create a second one.
  const player = useRef<HTMLAudioElement | null>(null);
  const alive = useRef(true);
  const recordedHere = useRef(false);

  function setMineBlob(blob: Blob) {
    setMine(URL.createObjectURL(blob));
  }

  // Free the previous clip's memory when it is replaced or the card closes.
  useEffect(() => () => {
    if (mine) URL.revokeObjectURL(mine);
  }, [mine]);

  // Feature check and last saved recording, after the first render
  // because both only exist in the browser.
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!canRecord()) setStatus("unsupported");
    loadRecording(cardId)
      .then((r) => {
        if (!cancelled && r && !recordedHere.current) setMineBlob(r.blob);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [cardId]);

  // Leaving the card: stop the mic, the timer and any sound.
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      stopMic();
      player.current?.pause();
    };
  }, []);

  // Pressing Check (or space) while recording finishes the recording.
  useEffect(() => {
    if (revealed && recorder.current?.state === "recording") recorder.current.stop();
  }, [revealed]);

  // The teacher's recording plays on Check, as it did before recording existed.
  useEffect(() => {
    if (revealed && teacher) play("teacher");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed]);

  function stopMic() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (recorder.current?.state === "recording") {
      recorder.current.ondataavailable = null;
      recorder.current.onstop = null;
      recorder.current.stop();
    }
    recorder.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }

  async function start() {
    player.current?.pause();
    setPlaying(null);
    setStatus("starting");
    setSaveFailed(false);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      // The card may have changed while the permission prompt was open.
      if (!alive.current) {
        s.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = s;
    } catch (e) {
      if (!alive.current) return;
      setStatus(e instanceof DOMException && e.name === "NotAllowedError" ? "denied" : "error");
      return;
    }

    const mimeType = pickMimeType();
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream.current, mimeType ? { mimeType } : undefined);
    } catch {
      stopMic();
      setStatus("error");
      return;
    }
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: rec.mimeType || mimeType || "audio/mp4" });
      recorder.current = null;
      stopMic();
      setStatus("idle");
      if (blob.size === 0 || !alive.current) return;
      recordedHere.current = true;
      setMineBlob(blob);
      saveRecording(cardId, blob).catch(() => setSaveFailed(true));
    };
    recorder.current = rec;
    rec.start();
    setSeconds(0);
    setStatus("recording");
    const began = Date.now();
    timer.current = setInterval(() => {
      const s = Math.floor((Date.now() - began) / 1000);
      setSeconds(s);
      if (s >= MAX_SECONDS && rec.state === "recording") rec.stop();
    }, 250);
  }

  function stop() {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  function play(which: "teacher" | "mine", then?: "mine") {
    const src = which === "teacher" ? teacher?.src : mine;
    if (!src) return;
    const el = player.current ?? new window.Audio();
    player.current = el;
    if (playing === which && !then && !el.paused) {
      el.pause();
      setPlaying(null);
      return;
    }
    el.pause();
    el.src = src;
    el.onended = () => {
      if (then && mine) {
        play(then);
      } else {
        setPlaying(null);
      }
    };
    el.onerror = () => setPlaying(null);
    setPlaying(which);
    // Browsers block sound until the page has had a tap or key press.
    el.play().catch(() => setPlaying(null));
  }

  const busy = status === "starting" || status === "recording";

  const recordButton = (
    <button
      type="button"
      onClick={busy ? stop : start}
      disabled={status === "starting"}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap ${
        status === "recording" ? "border-again text-again" : "border-line bg-surface hover:border-accent"
      }`}
    >
      {status === "recording" ? (
        <>
          <span aria-hidden className="h-2.5 w-2.5 animate-pulse rounded-full bg-again" />
          Stop ({formatTime(seconds)})
        </>
      ) : (
        <>
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-again" />
          {status === "starting" ? "Starting…" : mine ? "Record again" : "Record yourself"}
        </>
      )}
    </button>
  );

  const playButton = (which: "teacher" | "mine", text: string) => (
    <button
      type="button"
      onClick={() => play(which)}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium hover:border-accent disabled:opacity-50"
    >
      <span aria-hidden>{playing === which ? "■" : "▶"}</span>
      {text}
    </button>
  );

  const message =
    status === "unsupported"
      ? "Recording isn't available in this browser."
      : status === "denied"
        ? "The microphone is blocked for this site. Allow it in your browser's settings (on iPhone: Settings, Apps, Safari, Microphone), then try again."
        : status === "error"
          ? "Couldn't start the microphone. Check that no other app is using it, then try again."
          : saveFailed
            ? "Your recording plays now but couldn't be saved for next time. Your browser may be blocking storage, for example in a private window."
            : null;

  const note = message && (
    <p className="max-w-prose text-center text-sm text-muted" role="status">
      {message}
    </p>
  );

  if (!revealed) {
    if (status === "unsupported") return null;
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-wrap justify-center gap-2">
          {recordButton}
          {mine && !busy && playButton("mine", "Play mine")}
        </div>
        {note}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-2 rounded-lg border border-line p-3">
          <span className="text-xs tracking-wide text-muted uppercase">Teacher</span>
          {teacher ? playButton("teacher", "Play") : <p className="py-2 text-sm text-muted">No recording yet</p>}
        </div>
        <div className="flex flex-col items-center gap-2 rounded-lg border border-line p-3">
          <span className="text-xs tracking-wide text-muted uppercase">You</span>
          {mine && !busy && playButton("mine", "Play")}
          {status !== "unsupported" && recordButton}
        </div>
      </div>
      {teacher && mine && !busy && (
        <button
          type="button"
          onClick={() => play("teacher", "mine")}
          className="text-sm font-medium text-accent underline underline-offset-2"
        >
          Play teacher, then me
        </button>
      )}
      {note}
    </div>
  );
}

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
