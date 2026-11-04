"use client";

import { useEffect, useState } from "react";
import { DEFAULT_NEW_PER_DAY, loadProgress, resetProgress, saveNewPerDay } from "@/lib/progress";

const OPTIONS = [5, 10, 15, 20, 30];

export function Settings() {
  const [newPerDay, setNewPerDay] = useState(DEFAULT_NEW_PER_DAY);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    // localStorage only exists in the browser, so read it after the first render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNewPerDay(loadProgress().newPerDay);
  }, []);

  function changeLimit(value: number) {
    setNewPerDay(value);
    try {
      saveNewPerDay(value);
      setStatus("Saved.");
    } catch {
      setStatus("Couldn't save. Your browser may be blocking storage for this site.");
    }
  }

  function reset() {
    if (!window.confirm("Delete all your progress on this device? This can't be undone.")) return;
    resetProgress();
    setNewPerDay(DEFAULT_NEW_PER_DAY);
    setStatus("Progress deleted.");
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted">Your progress is saved in this browser. Other devices and browsers keep their own.</p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="font-bold">New cards per day</h2>
        <p className="text-sm text-muted">Reviews of cards you already know are never limited.</p>
        <select
          id="new-per-day"
          value={newPerDay}
          onChange={(e) => changeLimit(Number(e.target.value))}
          className="self-start rounded-md border border-line bg-surface px-3 py-2"
        >
          {OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-bold">Start over</h2>
        <button type="button" onClick={reset} className="self-start rounded-full border border-again px-4 py-2 text-sm text-again">
          Delete my progress
        </button>
      </section>

      {status && <p className="text-sm text-muted" role="status">{status}</p>}
    </div>
  );
}
