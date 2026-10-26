import { sounds, stressMarks, weakVowels } from "@/content";
import type { SoundGroup } from "@/content/types";
import { SoundTile } from "./SoundTile";

const groups: { group: SoundGroup; title: string }[] = [
  { group: "short", title: "Short vowels" },
  { group: "long", title: "Long vowels" },
  { group: "diphthong", title: "Diphthongs" },
  { group: "consonant", title: "Consonants" },
];

export default function ChartPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">IPA chart</h1>
        <p className="max-w-prose text-muted">
          The 44 sounds of British RP as EPD writes them. Tap a symbol for a tip and its recording.
        </p>
      </div>

      {groups.map(({ group, title }) => (
        <section key={group} className="flex flex-col gap-3">
          <h2 className="font-bold">{title}</h2>
          <ul className="grid grid-cols-2 items-start gap-3 sm:grid-cols-4">
            {sounds
              .filter((s) => s.group === group)
              .map((s) => (
                <SoundTile key={s.id} sound={s} />
              ))}
          </ul>
        </section>
      ))}

      <section className="flex flex-col gap-3">
        <h2 className="font-bold">Weak vowels and stress</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {weakVowels.map((v) => (
            <div key={v.ipa} className="flex items-baseline gap-3">
              <dt className="w-8 font-ipa text-2xl">{v.ipa}</dt>
              <dd className="text-muted">Unstressed, as in {v.keyWords.join(", ")}</dd>
            </div>
          ))}
          {stressMarks.map((m) => (
            <div key={m.ipa} className="flex items-baseline gap-3">
              <dt className="w-8 font-ipa text-2xl">{m.ipa}</dt>
              <dd className="text-muted">{m.name}, placed before the stressed syllable</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
