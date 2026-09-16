/**
 * Seva Saarthi AI Model 2 V4.2 - Language and Script Detection Router
 * 
 * Accurately classifies query strings and field content into script and language classes:
 * - ENGLISH: Standard Latin-script names / addresses
 * - HINDI: Devanagari script (Unicode range \u0900-\u097F)
 * - TELUGU: Telugu script (Unicode range \u0C00-\u0C7F)
 * - TRANSLITERATED_INDIC: Romanized Hindi / Telugu phonetic transliterations
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
}

// Common Indic transliteration patterns in Latin script
const TRANSLITERATION_PATTERNS = [
  /([aeiou])\1+/i,              // double vowels: aa, ee, oo, ii
  /(bh|ch|dh|gh|jh|kh|ph|sh|th|zh)/i, // aspirated consonants
  /(kavitha|kumaar|poojah|sharmma|raoo|patell|singhh|vermaa|deepakk|naiduu|yadaav)/i,
  /(nagar|puram|palli|guda|wadi|bad|gaon|colony|basti)/i,
];

export class LanguageRouter {
  /**
   * Detects the script and language class for a given text or entity query.
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

    // Check pure scripts first
    if (devanagariCount > 0 && latinCount === 0 && teluguCount === 0) {
      return {
        primaryLanguage: 'HINDI',
        isMultilingualOrTransliterated: true,
        scriptBreakdown: { latin: 0, devanagari: devanagariCount, telugu: 0, other: otherCount },
        detectedFeatures,
      };
    }

    if (teluguCount > 0 && latinCount === 0 && devanagariCount === 0) {
      return {
        primaryLanguage: 'TELUGU',
        isMultilingualOrTransliterated: true,
        scriptBreakdown: { latin: 0, devanagari: 0, telugu: teluguCount, other: otherCount },
        detectedFeatures,
      };
    }

    // Mixed scripts
    if ((devanagariCount > 0 && teluguCount > 0) || (devanagariCount > 0 && latinCount > 0) || (teluguCount > 0 && latinCount > 0)) {
      return {
        primaryLanguage: 'MIXED',
        isMultilingualOrTransliterated: true,
        scriptBreakdown: { latin: latinCount, devanagari: devanagariCount, telugu: teluguCount, other: otherCount },
        detectedFeatures: [...detectedFeatures, 'mixed_multilingual_scripts'],
      };
    }

    // Pure Latin: check if it represents transliterated Indic
    let isTransliterated = false;
    for (const pattern of TRANSLITERATION_PATTERNS) {
      if (pattern.test(trimmed)) {
        isTransliterated = true;
        detectedFeatures.push(`transliteration_match:${pattern.source}`);
      }
    }

    // Check for character repetitions or non-standard phonotactics
    if (/(.)\1{2,}/i.test(trimmed)) {
      isTransliterated = true;
      detectedFeatures.push('repeated_character_elongation');
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
