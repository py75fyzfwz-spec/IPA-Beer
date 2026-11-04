import Link from "next/link";
import { units } from "@/content";
import { UnitCards } from "./UnitCards";

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
        {units.map((unit) => (
          <li key={unit.number} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <UnitCards
              unit={unit.number}
              title={unit.title}
              seminars={
                unit.seminars.length > 0
                  ? `Seminar ${unit.seminars.map((d) => dateFormat.format(new Date(d))).join(" and ")}`
                  : "Practice until the PC Pool test"
              }
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
