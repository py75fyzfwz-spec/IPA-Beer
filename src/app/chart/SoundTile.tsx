"use client";

import { useState } from "react";
import { PlayButton } from "@/components/PlayButton";
import type { Sound } from "@/content/types";

export function SoundTile({ sound }: { sound: Sound }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="flex flex-col rounded-lg border border-line bg-surface">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex flex-col items-start gap-1 p-3 text-left"
      >
        <span className="font-ipa text-3xl">{sound.ipa}</span>
        <span className="text-sm text-muted">{sound.keyWords.join(", ")}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-2 border-t border-line p-3 text-sm">
          <p>{sound.tip}</p>
          <PlayButton audio={sound.audio} label="Hear it" />
        </div>
      )}
    </li>
  );
}
