"use client";

import { useEffect, useRef, useState } from "react";
import type { Audio as AudioFile } from "@/content/types";

type Props = {
  audio?: AudioFile;
  label?: string;
  autoPlay?: boolean;
};

export function PlayButton({ audio, label = "Play recording", autoPlay = false }: Props) {
  const player = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  const play = () => {
    if (!audio) return;
    player.current?.pause();
    const el = new Audio(audio.src);
    player.current = el;
    el.onplay = () => setPlaying(true);
    el.onended = () => setPlaying(false);
    el.onerror = () => {
      setPlaying(false);
      setFailed(true);
    };
    // Browsers block sound until the page has had a tap or key press.
    el.play().catch(() => setPlaying(false));
  };

  useEffect(() => {
    if (autoPlay) play();
    return () => player.current?.pause();
    // Play once per card, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio?.src]);

  if (!audio) {
    return <p className="text-sm text-muted">No recording yet</p>;
  }

  return (
    <button
      type="button"
      onClick={play}
      className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium hover:border-accent"
    >
      <span aria-hidden>{playing ? "■" : "▶"}</span>
      {failed ? "Recording missing" : label}
    </button>
  );
}
