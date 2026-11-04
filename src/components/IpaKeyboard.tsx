"use client";

// On-screen keys for symbols a normal keyboard lacks. Plain letters like
// p, t, s, m are typed as usual.
const rows: { label: string; keys: string[] }[] = [
  { label: "Vowels", keys: ["ɪ", "e", "æ", "ʌ", "ɒ", "ʊ", "ə", "i", "u", "a", "ɑ", "ɔ", "ɜ", "ː"] },
  { label: "Consonants", keys: ["θ", "ð", "ʃ", "ʒ", "tʃ", "dʒ", "ŋ", "j", "ɡ", "r"] },
  { label: "Stress", keys: ["ˈ", "ˌ"] },
];

type Props = {
  onKey: (symbol: string) => void;
  onBackspace: () => void;
};

export function IpaKeyboard({ onKey, onBackspace }: Props) {
  return (
    <div className="flex flex-col gap-2" aria-label="IPA keyboard">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-wrap gap-1.5">
          {row.keys.map((k) => (
            <button
              key={k}
              type="button"
              // Keep focus (and the cursor) in the text field.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onKey(k)}
              className="min-w-10 rounded-md border border-line bg-surface px-2 py-1.5 font-ipa text-xl hover:border-accent"
              aria-label={row.label === "Stress" ? (k === "ˈ" ? "primary stress" : "secondary stress") : k}
            >
              {k}
            </button>
          ))}
          {row.label === "Stress" && (
            <>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onKey(" ")}
                className="rounded-md border border-line bg-surface px-4 py-1.5 text-sm"
              >
                space
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={onBackspace}
                className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm"
                aria-label="delete"
              >
                ⌫
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
