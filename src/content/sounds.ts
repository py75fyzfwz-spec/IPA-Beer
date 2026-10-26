import type { Sound } from "./types";

// The 44 phonemes of British RP in EPD notation, in teaching order.
// Recordings are not added yet: drop files into /public/audio/sounds and
// set `audio` on each entry.
export const sounds: Sound[] = [
  // Short vowels
  { id: "kit", ipa: "ɪ", group: "short", keyWords: ["kit", "bid", "hymn"], tip: "Like the i in German “mit”." },
  { id: "dress", ipa: "e", group: "short", keyWords: ["dress", "bed", "head"], tip: "Like the e in German “Bett”. EPD writes it e, not ɛ." },
  { id: "trap", ipa: "æ", group: "short", keyWords: ["trap", "bad", "cat"], tip: "Opener than German ä: drop your jaw. Keep bad /bæd/ apart from bed /bed/." },
  { id: "strut", ipa: "ʌ", group: "short", keyWords: ["strut", "cup", "love"], tip: "A short, central a-like sound. Not the u in German “Butter”." },
  { id: "lot", ipa: "ɒ", group: "short", keyWords: ["lot", "odd", "wash"], tip: "Short and rounded with an open jaw, more open than the o in German “Gott”." },
  { id: "foot", ipa: "ʊ", group: "short", keyWords: ["foot", "good", "put"], tip: "Like the u in German “Mutter”." },
  { id: "schwa", ipa: "ə", group: "short", keyWords: ["about", "comma", "sofa"], tip: "The weak, relaxed vowel, like the e in German “bitte”. Never stressed." },

  // Long vowels
  { id: "fleece", ipa: "iː", group: "long", keyWords: ["fleece", "sea", "machine"], tip: "Like the ie in German “Lied”. ː means long." },
  { id: "start", ipa: "ɑː", group: "long", keyWords: ["start", "father", "car"], tip: "Long and back, like the a in German “Vater”. No r in RP: car /kɑː/." },
  { id: "thought", ipa: "ɔː", group: "long", keyWords: ["thought", "law", "north"], tip: "Long and well rounded. No r in RP: door /dɔː/." },
  { id: "goose", ipa: "uː", group: "long", keyWords: ["goose", "two", "blue"], tip: "Like the u in German “gut”." },
  { id: "nurse", ipa: "ɜː", group: "long", keyWords: ["nurse", "stir", "bird"], tip: "Long and central, with spread lips and no r. Not German ö." },

  // Diphthongs
  { id: "face", ipa: "eɪ", group: "diphthong", keyWords: ["face", "day", "steak"], tip: "Glides from e to ɪ. A plain long German e in “See” is too flat." },
  { id: "price", ipa: "aɪ", group: "diphthong", keyWords: ["price", "high", "try"], tip: "Like the ai in German “Mai”." },
  { id: "choice", ipa: "ɔɪ", group: "diphthong", keyWords: ["choice", "boy", "coin"], tip: "Like the eu in German “neu”." },
  { id: "goat", ipa: "əʊ", group: "diphthong", keyWords: ["goat", "show", "no"], tip: "Starts at schwa and glides to ʊ. Not the long o in German “so”." },
  { id: "mouth", ipa: "aʊ", group: "diphthong", keyWords: ["mouth", "now", "house"], tip: "Like the au in German “Haus”." },
  { id: "near", ipa: "ɪə", group: "diphthong", keyWords: ["near", "here", "serious"], tip: "Glides from ɪ to schwa. No r in RP." },
  { id: "square", ipa: "eə", group: "diphthong", keyWords: ["square", "fair", "various"], tip: "Glides from e to schwa. No r in RP." },
  { id: "cure", ipa: "ʊə", group: "diphthong", keyWords: ["cure", "poor", "jury"], tip: "Glides from ʊ to schwa. Many speakers now use ɔː instead." },

  // Consonants
  { id: "p", ipa: "p", group: "consonant", keyWords: ["pen", "copy", "happen"], tip: "Aspirated at the start of a stressed syllable, as in German." },
  { id: "b", ipa: "b", group: "consonant", keyWords: ["back", "bubble", "job"], tip: "Keep it voiced at the end of a word: cab ≠ cap." },
  { id: "t", ipa: "t", group: "consonant", keyWords: ["tea", "tight", "button"], tip: "Aspirated at the start of a stressed syllable, as in German." },
  { id: "d", ipa: "d", group: "consonant", keyWords: ["day", "ladder", "odd"], tip: "Keep it voiced at the end of a word: bed ≠ bet." },
  { id: "k", ipa: "k", group: "consonant", keyWords: ["key", "cock", "school"], tip: "Aspirated at the start of a stressed syllable, as in German." },
  { id: "g", ipa: "ɡ", group: "consonant", keyWords: ["get", "giggle", "ghost"], tip: "Keep it voiced at the end of a word: dog ≠ dock." },
  { id: "tsh", ipa: "tʃ", group: "consonant", keyWords: ["church", "match", "nature"], tip: "Like the tsch in German “Deutsch”." },
  { id: "dzh", ipa: "dʒ", group: "consonant", keyWords: ["judge", "age", "soldier"], tip: "The voiced partner of tʃ. Not the German j." },
  { id: "f", ipa: "f", group: "consonant", keyWords: ["fat", "coffee", "rough"], tip: "As in German." },
  { id: "v", ipa: "v", group: "consonant", keyWords: ["view", "heavy", "move"], tip: "Like German w: top teeth on the lower lip. Keep it voiced at the end: leave ≠ leaf." },
  { id: "theta", ipa: "θ", group: "consonant", keyWords: ["thing", "author", "path"], tip: "Tongue tip between the teeth, then blow. Not s or f." },
  { id: "eth", ipa: "ð", group: "consonant", keyWords: ["this", "other", "smooth"], tip: "The voiced partner of θ. Not d or z." },
  { id: "s", ipa: "s", group: "consonant", keyWords: ["soon", "cease", "sister"], tip: "Always voiceless, even before a vowel: Sue /suː/, not /zuː/." },
  { id: "z", ipa: "z", group: "consonant", keyWords: ["zero", "zone", "roses"], tip: "Voiced s, as in German “Sonne”. Not German z, which is ts. Keep it voiced at the end: dogs." },
  { id: "sh", ipa: "ʃ", group: "consonant", keyWords: ["ship", "sure", "wish"], tip: "Like German sch." },
  { id: "zh", ipa: "ʒ", group: "consonant", keyWords: ["pleasure", "vision", "genre"], tip: "The voiced partner of ʃ, like the j in French “journal”." },
  { id: "h", ipa: "h", group: "consonant", keyWords: ["hot", "whole", "behind"], tip: "As in German." },
  { id: "m", ipa: "m", group: "consonant", keyWords: ["more", "hammer", "sum"], tip: "As in German." },
  { id: "n", ipa: "n", group: "consonant", keyWords: ["nice", "know", "funny"], tip: "As in German." },
  { id: "ng", ipa: "ŋ", group: "consonant", keyWords: ["ring", "long", "thanks"], tip: "Like the ng in German “Ding”, with no g after it: singer /ˈsɪŋə/." },
  { id: "l", ipa: "l", group: "consonant", keyWords: ["light", "valley", "feel"], tip: "Clear before a vowel, dark (back of the tongue raised) at the end: feel." },
  { id: "r", ipa: "r", group: "consonant", keyWords: ["right", "sorry", "arrange"], tip: "Tongue tip raised, not rolled and not in the throat. In RP only before a vowel." },
  { id: "j", ipa: "j", group: "consonant", keyWords: ["yet", "use", "beauty"], tip: "Like the j in German “ja”. It is the y sound, not the j in jam." },
  { id: "w", ipa: "w", group: "consonant", keyWords: ["wet", "one", "queen"], tip: "Rounded lips, no teeth. German w is English v." },
];

// Weak vowels EPD uses in unstressed syllables. They are on the keyboard
// and in the chart, but have no cards of their own.
export const weakVowels = [
  { ipa: "i", keyWords: ["happy", "radiation"] },
  { ipa: "u", keyWords: ["influence", "to each"] },
];

export const stressMarks = [
  { ipa: "ˈ", name: "primary stress" },
  { ipa: "ˌ", name: "secondary stress" },
];
