import type { Word } from "./types";

// SAMPLE ENTRIES so the study flow works end to end. Replace them with the
// course word lists. Transcriptions follow EPD (Jones, eds. Roach & Hartman).
// `unit` is the class unit the word belongs to (see units.ts).
export const words: Word[] = [
  { id: "bed", spelling: "bed", ipa: "bed", unit: 6 },
  { id: "bad", spelling: "bad", ipa: "bæd", unit: 6 },
  { id: "cup", spelling: "cup", ipa: "kʌp", unit: 1 },
  { id: "west", spelling: "west", ipa: "west", unit: 5 },
  { id: "vest", spelling: "vest", ipa: "vest", unit: 5 },
  { id: "very", spelling: "very", ipa: "ˈveri", unit: 5 },
  { id: "think", spelling: "think", ipa: "θɪŋk", unit: 4 },
  { id: "mother", spelling: "mother", ipa: "ˈmʌðə", unit: 4 },
  { id: "weather", spelling: "weather", ipa: "ˈweðə", unit: 4 },
  { id: "bird", spelling: "bird", ipa: "bɜːd", unit: 1 },
  { id: "house", spelling: "house", ipa: "haʊs", unit: 3 },
];
