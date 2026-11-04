import type { Word } from "./types";

// SAMPLE ENTRIES so the study flow works end to end. Replace them with the
// course word lists. Transcriptions follow EPD (Jones, eds. Roach & Hartman).
// `unit` is the class unit the word belongs to (see units.ts).
export const words: Word[] = [
  { id: "bed", ipa: "bed", unit: 6 },
  { id: "bad", ipa: "bæd", unit: 6 },
  { id: "cup", ipa: "kʌp", unit: 1 },
  { id: "west", ipa: "west", unit: 5 },
  { id: "vest", ipa: "vest", unit: 5 },
  { id: "very", ipa: "ˈveri", unit: 5 },
  { id: "think", ipa: "θɪŋk", unit: 4 },
  { id: "mother", ipa: "ˈmʌðə", unit: 4 },
  { id: "weather", ipa: "ˈweðə", unit: 4 },
  { id: "bird", ipa: "bɜːd", unit: 1 },
  { id: "house", ipa: "haʊs", unit: 3 },
];
