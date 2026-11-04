"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderStatus = "idle" | "starting" | "recording" | "unsupported" | "denied" | "error";

// Formats that play back everywhere come first: AAC in MP4 works on every
// browser, including iPhone Safari, so Chrome uses it too when it can.
const TYPES = ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];

function pickType() {
  if (typeof MediaRecorder === "undefined") return undefined;
  return TYPES.find((t) => MediaRecorder.isTypeSupported?.(t));
}

const supported = () =>
  typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);

// Microphone recording for teacher mode. The microphone stays open between
// takes so going from card to card doesn't ask or wait each time; it is
// released when teacher mode closes.
export function useRecorder(maxSeconds = 30) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [seconds, setSeconds] = useState(0);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTake = useRef<((blob: Blob) => void) | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!supported()) setStatus("unsupported");
  }, []);

  const release = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (recorder.current?.state === "recording") {
      recorder.current.onstop = null;
      recorder.current.stop();
    }
    recorder.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }, []);

  useEffect(() => release, [release]);

  // Ends the current take; the clip arrives through the callback given to start().
  const stop = useCallback(() => {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }, []);

  const start = useCallback(
    async (done: (blob: Blob) => void) => {
      if (!supported() || recorder.current?.state === "recording") return;
      onTake.current = done;
      setStatus("starting");
      try {
        if (!stream.current || stream.current.getAudioTracks().every((t) => t.readyState === "ended")) {
          stream.current = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true },
          });
        }
      } catch (e) {
        setStatus(e instanceof DOMException && e.name === "NotAllowedError" ? "denied" : "error");
        return;
      }
      const type = pickType();
      let rec: MediaRecorder;
      try {
        rec = new MediaRecorder(stream.current, type ? { mimeType: type } : undefined);
      } catch {
        setStatus("error");
        return;
      }
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      rec.onstop = () => {
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        recorder.current = null;
        setStatus("idle");
        // Drop the codec part: "audio/mp4;codecs=…" → "audio/mp4".
        const blob = new Blob(chunks, { type: (rec.mimeType || type || "audio/mp4").split(";")[0] });
        if (blob.size) onTake.current?.(blob);
      };
      recorder.current = rec;
      rec.start();
      setSeconds(0);
      setStatus("recording");
      const began = Date.now();
      timer.current = setInterval(() => {
        const s = Math.floor((Date.now() - began) / 1000);
        setSeconds(s);
        if (s >= maxSeconds && rec.state === "recording") rec.stop();
      }, 200);
    },
    [maxSeconds],
  );

  return { status, seconds, start, stop, release, recording: status === "recording" };
}
