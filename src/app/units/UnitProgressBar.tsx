"use client";

import { useEffect, useState } from "react";
import type { Card } from "ts-fsrs";
import { cardsInUnit } from "@/content";
import { ProgressBar } from "@/components/ProgressBar";
import { loadProgress } from "@/lib/progress";
import { unitProgress } from "@/lib/unitProgress";

export function UnitProgressBar({ unit, title }: { unit: number; title: string }) {
  const [states, setStates] = useState<Map<string, Card>>(new Map());

  useEffect(() => {
    // localStorage only exists in the browser, so read it after the first render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStates(loadProgress().states);
  }, []);

  return <ProgressBar progress={unitProgress(cardsInUnit(unit), states)} label={`Unit ${unit}: ${title} progress`} />;
}
