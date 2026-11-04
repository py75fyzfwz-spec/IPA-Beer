"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Card } from "ts-fsrs";
import { ProgressBar } from "@/components/ProgressBar";
import { loadProgress } from "@/lib/progress";
import { unitProgress } from "@/lib/unitProgress";
import { inUnit, useAllCards } from "@/lib/useCards";

// A unit's card count, progress and Study link. Client side, because cards
// added in teacher mode and the learner's progress only exist at runtime.
export function UnitCards({ unit, title, seminars }: { unit: number; title: string; seminars: string }) {
  const { cards } = useAllCards();
  const [states, setStates] = useState<Map<string, Card>>(new Map());

  useEffect(() => {
    // localStorage only exists in the browser, so read it after the first render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStates(loadProgress().states);
  }, []);

  const unitCards = inUnit(cards, unit);
  const count = unitCards.length;
  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="font-medium">
          {unit}. {title}
        </span>
        <span className="text-sm text-muted">
          {seminars}
          {" · "}
          {count === 0 ? "no cards yet" : count === 1 ? "1 card" : `${count} cards`}
        </span>
        {count > 0 && (
          <div className="mt-2 max-w-xs">
            <ProgressBar progress={unitProgress(unitCards, states)} label={`Unit ${unit}: ${title} progress`} />
          </div>
        )}
      </div>
      {count > 0 && (
        <Link
          href={`/study?unit=${unit}`}
          className="rounded-full border border-line px-4 py-1.5 text-sm font-medium hover:border-accent"
        >
          Study
        </Link>
      )}
    </>
  );
}
