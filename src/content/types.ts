// Content types. All learning content lives in this folder as plain data,
// so adding cards is an edit to a .ts file, not a database change.

export type Credit = {
  author: string;
  license: string;
  source: string; // URL of the original file
};

export type Audio = {
  src: string; // path under /public, e.g. "/audio/words/mother.mp3"
  credit?: Credit;
};

export type SoundGroup = "short" | "long" | "diphthong" | "consonant";

export type Sound = {
  id: string; // stable slug, used in card ids: "sound:<id>"
  ipa: string;
  group: SoundGroup;
  keyWords: string[];
  tip: string; // written for German speakers
  audio?: Audio;
};

export type Word = {
  id: string; // stable slug: "word:<id>"
  ipa: string; // EPD style, without slashes, with stress marks
  unit: number; // course order; lower units are introduced first
  audio?: Audio;
  // Stress marks must be typed in dictation only when true.
  requireStress?: boolean;
};

export type Sentence = {
  id: string; // stable slug: "sentence:<id>"
  ipa: string; // connected speech, with weak forms
  unit: number;
  // Word ids that must be started before this sentence unlocks.
  words?: string[];
  audio?: Audio;
};

export type CardKind = "sound" | "word" | "sentence" | "dictation";

export type StudyCard =
  | { id: string; kind: "sound"; sound: Sound }
  | { id: string; kind: "word"; word: Word }
  | { id: string; kind: "sentence"; sentence: Sentence }
  | { id: string; kind: "dictation"; word: Word };
