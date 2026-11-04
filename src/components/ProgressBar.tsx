import type { UnitProgress } from "@/lib/unitProgress";

const pct = (n: number, total: number) => `${(n / total) * 100}%`;

// Learned cards fill the bar solidly; cards studied but still being learned
// show as a lighter band after them.
export function ProgressBar({ progress, label }: { progress: UnitProgress; label: string }) {
  const { total, learned, learning } = progress;
  const studied = learned + learning;
  return (
    <div className="flex flex-col gap-1">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={learned}
        aria-valuetext={`${learned} of ${total} learned, ${studied} studied`}
        className="flex h-2 w-full overflow-hidden rounded-full bg-accent-soft"
      >
        <div className="h-full bg-accent transition-[width]" style={{ width: pct(learned, total) }} />
        <div className="h-full bg-accent/40 transition-[width]" style={{ width: pct(learning, total) }} />
      </div>
      <span className="text-xs text-muted">
        {learned} of {total} learned
        {learning > 0 && ` · ${learning} in progress`}
      </span>
    </div>
  );
}
