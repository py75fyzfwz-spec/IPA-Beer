// Splitting transcriptions into phonemes and checking typed dictation.

// Longest symbols first, so "tʃ" wins over "t" and "aɪ" over "a".
const MULTI = ["tʃ", "dʒ", "eɪ", "aɪ", "ɔɪ", "əʊ", "aʊ", "ɪə", "eə", "ʊə", "iː", "ɑː", "ɔː", "uː", "ɜː"];

export const STRESS = ["ˈ", "ˌ"];

export function tokenize(ipa: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < ipa.length) {
    const multi = MULTI.find((m) => ipa.startsWith(m, i));
    const token = multi ?? ipa[i];
    tokens.push(token);
    i += token.length;
  }
  return tokens;
}

// Turns what people type on a normal keyboard into IPA:
// g → ɡ, : → ː, ' → ˈ, and runs of spaces into one.
export function normalizeTyped(text: string): string {
  return text
    .replace(/g/g, "ɡ")
    .replace(/:/g, "ː")
    .replace(/['’]/g, "ˈ")
    .replace(/\s+/g, " ")
    .trim();
}

function strip(tokens: string[], keepStress: boolean) {
  return tokens.filter((t) => t !== " " && (keepStress || !STRESS.includes(t)));
}

export type DiffPart = { token: string; status: "ok" | "wrong" | "missing" };

export type CheckResult = { correct: boolean; parts: DiffPart[] };

// Compares typed IPA with the expected transcription, aligning both by
// phoneme so one wrong vowel doesn't mark the rest of the word wrong.
export function checkDictation(typed: string, expected: string, requireStress: boolean): CheckResult {
  const a = strip(tokenize(normalizeTyped(typed)), requireStress);
  const b = strip(tokenize(expected), requireStress);

  // Longest common subsequence table.
  const lcs = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const parts: DiffPart[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      parts.push({ token: a[i], status: "ok" });
      i++;
      j++;
    } else if (j < b.length && (i === a.length || lcs[i][j + 1] >= lcs[i + 1][j])) {
      parts.push({ token: b[j], status: "missing" });
      j++;
    } else {
      parts.push({ token: a[i], status: "wrong" });
      i++;
    }
  }

  return { correct: parts.every((p) => p.status === "ok"), parts };
}
