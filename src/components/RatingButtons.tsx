"use client";

import { Rating, type Card, type Grade } from "ts-fsrs";
import { formatInterval, preview } from "@/lib/srs";

const ratings: { grade: Grade; label: string; color: string }[] = [
  { grade: Rating.Again, label: "Again", color: "text-again" },
  { grade: Rating.Hard, label: "Hard", color: "text-hard" },
  { grade: Rating.Good, label: "Good", color: "text-good" },
  { grade: Rating.Easy, label: "Easy", color: "text-easy" },
];

type Props = {
  card: Card;
  onRate: (grade: Grade) => void;
  only?: Grade[];
};

// The four FSRS ratings, each showing when the card would come back.
// Keys 1 to 4 work too.
export function RatingButtons({ card, onRate, only }: Props) {
  const now = new Date();
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {ratings
        .filter((r) => !only || only.includes(r.grade))
        .map((r) => (
          <button
            key={r.grade}
            type="button"
            onClick={() => onRate(r.grade)}
            className="flex flex-col items-center rounded-lg border border-line bg-surface px-3 py-2 hover:border-accent"
          >
            <span className={`font-bold ${r.color}`}>
              {r.label} <span className="font-normal text-muted">{r.grade}</span>
            </span>
            <span className="text-xs text-muted">{formatInterval(now, preview(card, now, r.grade).due)}</span>
          </button>
        ))}
    </div>
  );
}
