// The units of the Foundation Course "Speaking English – British Speaker",
// in class order, with the date of the seminar each one prepares for.
export type Unit = {
  number: number;
  title: string;
  seminar: string; // ISO date of the (first) seminar
};

export const units: Unit[] = [
  { number: 1, title: "IPA vowels", seminar: "2026-10-21" },
  { number: 2, title: "IPA consonants", seminar: "2026-10-23" },
  { number: 3, title: "/s/ and /z/", seminar: "2026-10-28" },
  { number: 4, title: "“th”", seminar: "2026-10-30" },
  { number: 5, title: "/w/, /v/ and /r/", seminar: "2026-11-04" },
  { number: 6, title: "/a/ and /e/", seminar: "2026-11-06" },
  { number: 7, title: "Checked and atonic vowels", seminar: "2026-11-07" },
  { number: 8, title: "Linking", seminar: "2026-11-13" },
  { number: 9, title: "Prosody and reading practice", seminar: "2026-11-18" },
  { number: 10, title: "Intonation and tone groups", seminar: "2026-11-20" },
  { number: 11, title: "Imitating prosody", seminar: "2026-11-25" },
  { number: 12, title: "Revision and free narration introduction", seminar: "2026-11-27" },
  { number: 13, title: "Revision and free narration practice II", seminar: "2026-12-02" },
  { number: 14, title: "Describing a picture", seminar: "2026-12-04" },
  { number: 15, title: "Narrating films", seminar: "2026-12-09" },
  { number: 16, title: "Presentation structures", seminar: "2026-12-11" },
  { number: 17, title: "Listening exercises", seminar: "2026-12-16" },
  { number: 18, title: "More listening exercises", seminar: "2026-12-18" },
  { number: 19, title: "Challenging cartoons / listening", seminar: "2026-12-23" },
];
