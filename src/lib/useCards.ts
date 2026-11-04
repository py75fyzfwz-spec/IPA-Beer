"use client";

import { useEffect, useState } from "react";
import { allCards, unitOf } from "@/content";
import type { StudyCard } from "@/content/types";
import { emptyTeacherContent, mergeTeacherContent, type TeacherContent } from "./teacherContent";

// Every card, including the ones added and recorded in teacher mode.
// Fetched once per page load. If the server can't be reached, the built-in
// cards still work, just without teacher mode's additions.

let pending: Promise<TeacherContent> | null = null;

export function fetchTeacherContent(): Promise<TeacherContent> {
  pending ??= fetch("/api/teacher-content", { signal: AbortSignal.timeout(6000) })
    .then((r) => (r.ok ? (r.json() as Promise<TeacherContent>) : emptyTeacherContent))
    .catch(() => emptyTeacherContent);
  return pending;
}

export async function loadAllCards(): Promise<StudyCard[]> {
  return mergeTeacherContent(allCards, await fetchTeacherContent());
}

// The built-in cards right away, then the full list once it has loaded.
export function useAllCards(): { cards: StudyCard[]; loaded: boolean } {
  const [state, setState] = useState({ cards: allCards, loaded: false });
  useEffect(() => {
    let cancelled = false;
    loadAllCards().then((cards) => {
      if (!cancelled) setState({ cards, loaded: true });
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}

export const inUnit = (cards: StudyCard[], unit: number) => cards.filter((c) => unitOf(c) === unit);
