import Link from "next/link";
import { Ipa } from "@/components/Ipa";

const steps = [
  { title: "Sounds", body: "Learn the 44 sounds of British English, one symbol at a time." },
  { title: "Words", body: "Read whole words in IPA. A word unlocks once you know all its sounds." },
  { title: "Sentences", body: "Read connected speech, with the weak forms people really use." },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <Ipa size="lg">ˈriːd ɪt əz ɪt ˈsaʊndz</Ipa>
        <h1 className="text-2xl font-bold text-balance">Learn to read IPA without translating it back into spelling.</h1>
        <p className="max-w-prose text-muted">
          Read each transcription aloud, play the real recording, and rate how well you did. Spaced repetition
          brings every card back just before you would forget it.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/study" className="rounded-full bg-accent px-5 py-2.5 font-medium text-paper">
            Start studying
          </Link>
          <Link href="/chart" className="rounded-full border border-line bg-surface px-5 py-2.5 font-medium">
            Open the IPA chart
          </Link>
        </div>
      </section>

      <ol className="grid gap-4 sm:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step.title} className="flex flex-col gap-1 border-t-2 border-accent pt-3">
            <span className="text-xs tracking-wide text-muted uppercase">Step {i + 1}</span>
            <span className="font-bold">{step.title}</span>
            <span className="text-sm text-muted">{step.body}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
