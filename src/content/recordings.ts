// The teacher's recordings, matched to cards by id. Kept apart from
// words.ts and sentences.ts so adding audio never touches card content.
// Files live under /public. An `audio` set directly on an entry wins.
//
// Keys are card ids: "sound:<id>", "word:<id>" or "sentence:<id>".
export const recordings: Record<string, string> = {
  // "word:mother": "/audio/words/mother.mp3",
};

// Thanked on the Credits page. Leave null until the teacher has said
// how they want to be credited.
export const teacher: string | null = null;
