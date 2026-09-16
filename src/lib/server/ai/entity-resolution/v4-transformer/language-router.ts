/**
 * Seva Saarthi AI Model 2 V4.2 - Language and Script Detection Router
 * 
 * Accurately classifies query strings and field content into script and language classes:
 * - ENGLISH: Standard Latin-script names / addresses / conventional Latin Indian names
 * - HINDI: Devanagari script (Unicode range \u0900-\u097F)
 * - TELUGU: Telugu script (Unicode range \u0C00-\u0C7F)
 * - TRANSLITERATED_INDIC: Multi-signal Romanized Hindi / Telugu phonetic transliterations
 * - MIXED: Multi-script or mixed multilingual text
 */

export type DetectedLanguage =
  | 'ENGLISH'
  | 'HINDI'
  | 'TELUGU'
  | 'TRANSLITERATED_INDIC'
  | 'MIXED';

export interface LanguageDetectionResult {
  primaryLanguage: DetectedLanguage;
  isMultilingualOrTransliterated: boolean;
  scriptBreakdown: {
    latin: number;
    devanagari: number;
    telugu: number;
    other: number;
  };
  detectedFeatures: string[];
  signalEvidence?: {
    scriptDetected: string;
    transliterationScore: number;
    standardLatinScore: number;
    matchedSignals: string[];
  };
}

// Standard Latin-script English and conventional Indian names (NEVER trigger transliteration on their own)
const STANDARD_LATIN_INDIAN_NAMES = new Set([
  'sharma', 'bharat', 'chowdhary', 'chowdary', 'deepak', 'pooja', 'suresh',
  'kavitha', 'kavita', 'krishna', 'bhargav', 'shreya', 'amit', 'patel',
  'kumar', 'yadav', 'singh', 'verma', 'devi', 'naidu', 'reddy', 'radha',
  'venkatesh', 'anitha', 'anita', 'sai', 'karthik', 'ravi', 'haritha',
  'kiran', 'sneha', 'vikram', 'sunita', 'prashanth', 'aparna', 'mahesh',
  'lakshmi', 'laxmi', 'bhavana', 'sanjay', 'priya', 'vijay', 'manish',
  'gupta', 'agarwal', 'mishra', 'joshi', 'mukherjee', 'kulkarni', 'ghosh',
  'bose', 'choudhury', 'bhardwaj', 'pandey', 'shukla', 'shekhar', 'chandran',
  'menon', 'nair', 'pillai', 'iyer', 'iyengar', 'das', 'chatterjee',
  'banerjee', 'patil', 'deshmukh', 'thakur', 'shinde', 'jadhav', 'pawar',
  'more', 'kale', 'chavan', 'bhat', 'hegde', 'rao', 'shetty', 'kamath',
  'pai', 'nayak', 'prabhu', 'acharya', 'bhatt', 'tripathi', 'tiwari',
  'dubey', 'chaubey', 'dwivedi', 'trivedi', 'chaturvedi', 'pathak', 'ojha',
  'pandit', 'shastri', 'goswami', 'purohit', 'jha', 'singhania', 'mittal',
  'jindal', 'bansal', 'goyal', 'aggarwal', 'maheshwari', 'khandelwal',
  'khanna', 'kapoor', 'malhotra', 'chopra', 'sethi', 'oberoi', 'mehra',
  'anand', 'chadha', 'sahni', 'arora', 'batra', 'grover', 'luthra',
  'taneja', 'wadhwa', 'bhatia', 'ahuja', 'sehgal', 'puri', 'bedi', 'talwar',
  'nanda', 'duggal', 'sarna', 'gandhi', 'nehru', 'modi', 'kejriwal',
  'advani', 'vajpayee', 'desai', 'charan', 'gowda', 'bommai', 'yediyurappa',
  'siddaramaiah', 'kumaraswamy', 'devegowda', 'jagan', 'chiranjeevi',
  'pawan', 'kalyan', 'balakrishna', 'nagarjuna', 'prabhas', 'allu', 'arjun',
  'rana', 'daggubati', 'kcr', 'ktr', 'harish', 'revanth', 'sukumar',
  'trivikram', 'rajamouli', 'dutt', 'soni', 'meena', 'nagar', 'rawat',
  'choudhary', 'swamy', 'murthy', 'swami', 'murti', 'namboodiri', 'nambiar',
  'chacko', 'kurian', 'varghese', 'mathew', 'thomas', 'george', 'abraham',
  'john', 'david', 'smith', 'miller', 'brown', 'wilson', 'taylor', 'clark',
]);

// Standard English and administrative/address vocabulary
const STANDARD_ENGLISH_VOCABULARY = new Set([
  'road', 'street', 'block', 'sector', 'lane', 'house', 'plot', 'civil',
  'lines', 'near', 'post', 'office', 'station', 'building', 'apartment',
  'flat', 'floor', 'colony', 'enclave', 'district', 'state', 'city', 'town',
  'income', 'tax', 'land', 'revenue', 'health', 'housing', 'education',
  'pan', 'certificate', 'number', 'date', 'birth', 'father', 'mother',
  'guardian', 'student', 'farmer', 'owner', 'applicant', 'beneficiary',
  'residing', 'permanently', 'nearby', 'center', 'opp', 'opposite', 'behind',
  'cross', 'main', 'bazaar', 'nagar', 'puram', 'palli', 'wadi', 'guda',
  'bad', 'gaon', 'basti', 'village', 'circle', 'hyderabad', 'jaipur',
  'patna', 'warangal', 'guntur', 'delhi', 'mumbai', 'bengaluru', 'chennai',
  'kolkata', 'pune', 'ahmedabad', 'lucknow', 'chandigarh', 'bhopal',
]);

// Romanized Indic lexical terms / honorifics / relationship markers
const ROMANIZED_INDIC_LEXICAL_TERMS = new Set([
  'gaaru', 'garu', 'saab', 'sahab', 'annaya', 'anna', 'babu', 'mandal',
  'tehsil', 'taluk', 'taluka', 'zilla', 'gram', 'panchayat', 'nivas',
  'nilayam', 'illu', 'ooru', 'penta', 'sandhu', 'veedhi', 'palem', 'gali',
  'rasta', 'sadak', 'makan', 'suputra', 'suputri', 'atmaj', 'atmaja',
  'pita', 'pati', 'mata', 'ka', 'ki', 'ke', 'pata', 'ghar', 'intiperu',
  'giri', 'shree', 'shrimati', 'smt', 'sri',
]);

// Known explicit non-standard transliterated spellings (multi-character phonotactic elongation)
const EXPLICIT_TRANSLITERATED_SPELLINGS = new Set([
  'kumaar', 'poojah', 'sharmma', 'raoo', 'patell', 'singhh', 'vermaa',
  'deepakk', 'naiduu', 'yadaav', 'chowdaryy', 'chowdharyy', 'bhaarat',
  'kavithaa', 'reddyy', 'sureshh', 'shreyaa', 'bhargavv',
  'cawita', 'yadaw', 'anithaa', 'saaii',
  'harithaa', 'prashanthh', 'aparnaa', 'bhavanaa', 'maheshh', 'sanjayy',
  'priyaa', 'vijayy', 'manishh', 'suniita', 'snehaa',
]);

export class LanguageRouter {
  /**
   * Detects the script and language class for a given text or entity query.
   * Employs multi-signal evidence calibration rather than single regex triggers.
   */
  public static detectLanguage(text: string): LanguageDetectionResult {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return {
        primaryLanguage: 'ENGLISH',
        isMultilingualOrTransliterated: false,
        scriptBreakdown: { latin: 0, devanagari: 0, telugu: 0, other: 0 },
        detectedFeatures: [],
      };
    }

    const trimmed = text.trim();
    let latinCount = 0;
    let devanagariCount = 0;
    let teluguCount = 0;
    let otherCount = 0;

    for (let i = 0; i < trimmed.length; i++) {
      const code = trimmed.charCodeAt(i);
      // Latin letters: A-Z (65-90), a-z (97-122)
      if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
        latinCount++;
      }
      // Devanagari: 0x0900 to 0x097F (2304 to 2431)
      else if (code >= 0x0900 && code <= 0x097f) {
        devanagariCount++;
      }
      // Telugu: 0x0C00 to 0x0C7F (3072 to 3199)
      else if (code >= 0x0c00 && code <= 0x0c7f) {
        teluguCount++;
      }
      // Ignore whitespace, punctuation, digits
      else if (code > 127) {
        otherCount++;
      }
    }

    const detectedFeatures: string[] = [];

    if (devanagariCount > 0) detectedFeatures.push(`devanagari_chars:${devanagariCount}`);
    if (teluguCount > 0) detectedFeatures.push(`telugu_chars:${teluguCount}`);
    if (latinCount > 0) detectedFeatures.push(`latin_chars:${latinCount}`);

    // Pure Devanagari (Hindi)
    if (devanagariCount > 0 && latinCount === 0 && teluguCount === 0) {
      return {
        primaryLanguage: 'HINDI',
        isMultilingualOrTransliterated: true,
        scriptBreakdown: { latin: 0, devanagari: devanagariCount, telugu: 0, other: otherCount },
        detectedFeatures,
        signalEvidence: {
          scriptDetected: 'DEVANAGARI',
          transliterationScore: 0,
          standardLatinScore: 0,
          matchedSignals: ['pure_devanagari_script'],
        },
      };
    }

    // Pure Telugu
    if (teluguCount > 0 && latinCount === 0 && devanagariCount === 0) {
      return {
        primaryLanguage: 'TELUGU',
        isMultilingualOrTransliterated: true,
        scriptBreakdown: { latin: 0, devanagari: 0, telugu: teluguCount, other: otherCount },
        detectedFeatures,
        signalEvidence: {
          scriptDetected: 'TELUGU',
          transliterationScore: 0,
          standardLatinScore: 0,
          matchedSignals: ['pure_telugu_script'],
        },
      };
    }

    // Mixed scripts (Latin + Indic or Devanagari + Telugu)
    if (
      (devanagariCount > 0 && teluguCount > 0) ||
      (devanagariCount > 0 && latinCount > 0) ||
      (teluguCount > 0 && latinCount > 0)
    ) {
      return {
        primaryLanguage: 'MIXED',
        isMultilingualOrTransliterated: true,
        scriptBreakdown: { latin: latinCount, devanagari: devanagariCount, telugu: teluguCount, other: otherCount },
        detectedFeatures: [...detectedFeatures, 'mixed_multilingual_scripts'],
        signalEvidence: {
          scriptDetected: 'MIXED',
          transliterationScore: 0,
          standardLatinScore: 0,
          matchedSignals: ['mixed_scripts'],
        },
      };
    }

    // Pure Latin text: evaluate multi-signal transliteration vs standard English/Latin
    const tokens = trimmed
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 0);

    let transliterationScore = 0.0;
    let standardLatinScore = 0.0;
    const matchedSignals: string[] = [];

    for (const token of tokens) {
      // 1. Check if token is standard Latin Indian name or English word
      if (STANDARD_LATIN_INDIAN_NAMES.has(token) || STANDARD_ENGLISH_VOCABULARY.has(token)) {
        standardLatinScore += 1.0;
        continue;
      }

      // 2. Check for explicit known non-standard transliterations
      if (EXPLICIT_TRANSLITERATED_SPELLINGS.has(token)) {
        transliterationScore += 1.5;
        matchedSignals.push(`explicit_transliteration:${token}`);
        continue;
      }

      // 3. Check for Romanized Indic lexical words / honorifics
      if (ROMANIZED_INDIC_LEXICAL_TERMS.has(token)) {
        transliterationScore += 1.5;
        matchedSignals.push(`indic_lexical_word:${token}`);
        continue;
      }

      // 4. Multi-signal phonotactic pattern checks (require specific non-standard markers)
      let tokenTransliterationSignals = 0;

      // Signal A: Non-standard consonant double endings or vowel elongation not in standard English
      // e.g. token ending with double consonants 'kk', 'hh', 'mm', 'nn', 'pp', 'rr', 'tt', 'uu', 'vv', 'yy'
      if (/(kk|hh|mm|nn|pp|rr|tt|uu|vv|yy)$/i.test(token) && token.length > 3) {
        tokenTransliterationSignals++;
        matchedSignals.push(`double_consonant_ending:${token}`);
      }

      // Signal B: Triple character repetition (e.g. 'shaaarma', 'raaviii')
      if (/(.)\1{2,}/i.test(token)) {
        tokenTransliterationSignals++;
        matchedSignals.push(`character_elongation:${token}`);
      }

      // Signal C: Phonetic substitution characteristic of transliteration (e.g., 'c' for 'k' + 'w' for 'v')
      // Only when token deviates from standard Indian names
      if (token.includes('w') && !['wilson', 'wadhwa', 'warangal', 'wardha', 'west'].includes(token)) {
        tokenTransliterationSignals += 0.5;
        matchedSignals.push(`indic_w_v_phoneme:${token}`);
      }

      if (tokenTransliterationSignals >= 1.0) {
        transliterationScore += tokenTransliterationSignals;
      }
    }

    // MULTI-SIGNAL DECISION:
    // Transliterated Indic is accepted ONLY if transliterationScore >= 1.5
    // AND transliterationScore >= standardLatinScore.
    // Standard Latin queries with names like 'Sharma', 'Bharat', 'Chowdhary', 'Deepak',
    // 'Pooja', 'Suresh', 'Kavitha', 'Krishna', 'Bhargav', 'Shreya' will have
    // transliterationScore = 0 and standardLatinScore > 0 -> strictly classified as ENGLISH.
    const isTransliterated = transliterationScore >= 1.5 && transliterationScore >= standardLatinScore;

    if (isTransliterated) {
      detectedFeatures.push(...matchedSignals);
    }

    const primaryLanguage: DetectedLanguage = isTransliterated ? 'TRANSLITERATED_INDIC' : 'ENGLISH';

    return {
      primaryLanguage,
      isMultilingualOrTransliterated: isTransliterated,
      scriptBreakdown: {
        latin: latinCount,
        devanagari: devanagariCount,
        telugu: teluguCount,
        other: otherCount,
      },
      detectedFeatures,
      signalEvidence: {
        scriptDetected: 'LATIN',
        transliterationScore,
        standardLatinScore,
        matchedSignals,
      },
    };
  }

  /**
   * Helper to detect language across an entire EntityResolutionInput.
   */
  public static detectQueryLanguage(input: {
    name?: string;
    fatherName?: string;
    guardianName?: string;
    address?: string;
    district?: string;
  }): LanguageDetectionResult {
    const combined = [
      input.name || '',
      input.fatherName || '',
      input.guardianName || '',
      input.address || '',
      input.district || '',
    ].join(' ');

    return this.detectLanguage(combined);
  }
}

