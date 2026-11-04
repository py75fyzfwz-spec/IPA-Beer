import type { Sentence } from "./types";

// SAMPLE ENTRIES. Replace them with the course sentences, transcribed with
// the weak forms of connected speech.
export const sentences: Sentence[] = [
  { id: "cup-of-tea", text: "I'd like a cup of tea.", ipa: "aɪd ˈlaɪk ə ˈkʌp əv ˈtiː", unit: 8, words: ["cup"] },
  { id: "weather-like", text: "What's the weather like?", ipa: "ˈwɒts ðə ˈweðə laɪk", unit: 8, words: ["weather"] },

  // Unit 2: the class "phonetic sentences", copied from the handout.
  // ˈˈ marks the tonic syllable, | a tone-group boundary, ↓ a step down.
  { id: "cack-handedly", text: "He caught the ball cack-handedly.", ipa: "hi ˈkɔːt ðə ˈbɔːl kæk ˈˈhændɪdli", unit: 2 },
  { id: "under-duress", text: "The farmer ploughed the furrow, but only under duress.", ipa: "ðə ˈfɑːmə ˈplaʊd ðə ˈˈfʌrəʊ | bət ˈəʊnli ˈʌndə djuəˈˈres", unit: 2 },
  { id: "idolatrous-statement", text: "It was an idolatrous statement, not worthy of a man of the cloth.", ipa: "ɪt ˈwɒz ən aɪˈˈdɒlətrəs ˈsteɪtmənt | nɒt ˈwɜːði əv ə mæn əv ðə ˈˈklɒθ", unit: 2 },
  { id: "meredith-ricardo", text: "Meredith was criticised by Ricardo.", ipa: "ˈmerədɪθ wəz ˈkrɪtɪsaɪzd baɪ rɪˈˈkɑːdəʊ", unit: 2 },
  // The handout's spelling says "culture and history"; this follows the transcription.
  { id: "sinologists", text: "Sinologists study Chinese history and culture, said the rector.", ipa: "saɪˈnɒlədʒɪsts ˈstʌdi tʃaɪˈniːz ˈhɪstri ən ˈˈkʌltʃə | ↓ˈsed ðə ˈrektə", unit: 2 },

  // Unit 6: /a/ and /e/
  { id: "bad-bed", text: "The man said the bed was bad.", ipa: "ðə ˈmæn ˈsed ðə ˈbed wəz ˈbæd", unit: 6, words: ["man", "said", "bed", "bad"] },
  { id: "pen-pan", text: "Pass me the pen and the pan, please.", ipa: "ˈpɑːs mi ðə ˈpen ən ðə ˈpæn ˈpliːz", unit: 6, words: ["pen", "pan"] },
  { id: "black-cats", text: "Ten black cats sat on the mat.", ipa: "ˈten ˈblæk ˈkæts ˈsæt ɒn ðə ˈmæt", unit: 6, words: ["cat", "sat"] },
  { id: "met-friend", text: "Have you met my friend Jack?", ipa: "həv ju ˈmet maɪ ˈfrend ˈdʒæk", unit: 6, words: ["friend"] },
  { id: "many-men", text: "Many men had bread for breakfast.", ipa: "ˈmeni ˈmen ˈhæd ˈbred fə ˈbrekfəst", unit: 6, words: ["many", "men", "had", "bread", "breakfast"] },
  { id: "send-bag", text: "Can you send the bag to the head office?", ipa: "kən ju ˈsend ðə ˈbæɡ tə ðə ˈhed ˈɒfɪs", unit: 6, words: ["send", "bag", "head"] },
  { id: "happy-family", text: "Everybody in the family was happy.", ipa: "ˈevribɒdi ɪn ðə ˈfæməli wəz ˈhæpi", unit: 6, words: ["everybody", "family", "happy"] },
  { id: "saturday-festival", text: "We travelled to the festival on Saturday.", ipa: "wi ˈtrævld tə ðə ˈfestɪvl ɒn ˈsætədeɪ", unit: 6, words: ["travel", "festival", "saturday"] },
];
