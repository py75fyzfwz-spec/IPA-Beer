// The units of the Foundation Course "Speaking English – British Speaker",
// in class order, with the date of the seminar each one prepares for.
export type Unit = {
  number: number;
  title: string;
  seminars: string[]; // ISO dates of the seminars it prepares for; empty if none
};

export const units: Unit[] = [
  { number: 1, title: "IPA vowels", seminars: ["2026-10-21"] },
  { number: 2, title: "IPA consonants", seminars: ["2026-10-23"] },
  { number: 3, title: "/s/ and /z/", seminars: ["2026-10-28"] },
  { number: 4, title: "“th”", seminars: ["2026-10-30"] },
  { number: 5, title: "/w/, /v/ and /r/", seminars: ["2026-11-04"] },
  { number: 6, title: "/a/ and /e/", seminars: ["2026-11-06"] },
  { number: 7, title: "Checked and atonic vowels", seminars: ["2026-11-07"] },
  { number: 8, title: "Linking", seminars: ["2026-11-13"] },
  { number: 9, title: "Prosody and reading practice", seminars: ["2026-11-18"] },
  { number: 10, title: "Intonation and tone groups", seminars: ["2026-11-20"] },
  { number: 11, title: "Imitating prosody", seminars: ["2026-11-25"] },
  { number: 12, title: "Revision and free narration introduction", seminars: ["2026-11-27"] },
  { number: 13, title: "Revision and free narration practice II", seminars: ["2026-12-02"] },
  { number: 14, title: "Describing a picture", seminars: ["2026-12-04"] },
  { number: 15, title: "Narrating films", seminars: ["2026-12-09"] },
  { number: 16, title: "Presentation structures", seminars: ["2026-12-11"] },
  { number: 17, title: "Listening exercises", seminars: ["2026-12-16"] },
  { number: 18, title: "More listening exercises", seminars: ["2026-12-18"] },
  { number: 19, title: "Challenging cartoons / listening", seminars: ["2026-12-23"] },
  { number: 20, title: "Argumentation structures", seminars: ["2027-01-08"] },
  { number: 21, title: "Debating", seminars: ["2027-01-13"] },
  { number: 22, title: "Cartoon presentations", seminars: ["2027-01-15", "2027-01-20"] },
  { number: 23, title: "PC Pool exam practice", seminars: [] },
];
