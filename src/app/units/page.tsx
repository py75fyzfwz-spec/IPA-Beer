import Link from "next/link";
import { cardsInUnit, units } from "@/content";
import { UnitProgressBar } from "./UnitProgressBar";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });

export default function UnitsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Units</h1>
        <p className="max-w-prose text-muted">
          The units of the speaking class, in class order. Study one unit to prepare for its seminar. The{" "}
          <Link href="/study" className="underline">
            daily review
          </Link>{" "}
          mixes everything that&apos;s due from all units.
        </p>
      </div>

      <ol className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
        {units.map((unit) => {
          const count = cardsInUnit(unit.number).length;
          return (
            <li key={unit.number} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium">
                  {unit.number}. {unit.title}
                </span>
                <span className="text-sm text-muted">
                  {unit.seminars.length > 0
                    ? `Seminar ${unit.seminars.map((d) => dateFormat.format(new Date(d))).join(" and ")}`
                    : "Practice until the PC Pool test"}
                  {" · "}
                  {count === 0 ? "no cards yet" : count === 1 ? "1 card" : `${count} cards`}
                </span>
                {count > 0 && (
                  <div className="mt-2 max-w-xs">
                    <UnitProgressBar unit={unit.number} title={unit.title} />
                  </div>
                )}
              </div>
              {count > 0 && (
                <Link
                  href={`/study?unit=${unit.number}`}
                  className="rounded-full border border-line px-4 py-1.5 text-sm font-medium hover:border-accent"
                >
                  Study
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
