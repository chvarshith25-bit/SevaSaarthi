/**
 * Seva Saarthi AI Model 2 - English Subword/N-Gram Embedding Engine
 */

import { EmbeddingProvider } from './provider';
import { normalizeInPlace, cosineSimilarityUnitNormalized } from './vector-math';

function fnv1a(str: string, seed = 0x811c9dc5): number {
  let hval = seed;
  for (let i = 0; i < str.length; i++) {
    hval ^= str.charCodeAt(i);
    hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
  }
  return hval >>> 0;
}

const ADDRESS_SYNONYMS: Record<string, string> = {
  'H NO': 'HNO',
  'H.NO': 'HNO',
  'HOUSE NO': 'HNO',
  'CROSS ROAD': 'X RD',
  'CROSS RD': 'X RD',
  'X ROAD': 'X RD',
  'MAIN ROAD': 'MAIN RD',
  'NAGAR': 'NGR',
  'STREET': 'ST',
  'ROAD': 'RD',
  'LANE': 'LN',
  'BLOCK': 'BLK',
  'APARTMENT': 'APT',
  'APARTMENTS': 'APT',
  'VILLAGE': 'VILL',
  'DISTRICT': 'DIST',
  'TALUK': 'TALUK',
  'MANDAL': 'MANDAL',
};

function canonicalizeText(text: string): string {
  let upper = text.toUpperCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ');
  for (const [k, v] of Object.entries(ADDRESS_SYNONYMS)) {
    upper = upper.replace(new RegExp(`\\b${k}\\b`, 'g'), v);
  }
  return upper.replace(/\s+/g, ' ').trim();
}

export class EnglishNgramEmbedder implements EmbeddingProvider {
  readonly modelId = 'seva-saarthi-english-subword-v1';
  readonly dimension: number;

  constructor(dimension = 128) {
    this.dimension = dimension;
  }

  /**
   * Generates a 128-dimensional dense float vector for English names and address strings.
   */
  async generateEmbedding(text: string): Promise<Float32Array> {
    const vector = new Float32Array(this.dimension);
    if (!text || typeof text !== 'string') {
      return vector;
    }

    const clean = canonicalizeText(text);

    if (clean.length === 0) {
      return vector;
    }

    const words = clean.split(' ').filter(w => w.length > 0);

    for (let wordIdx = 0; wordIdx < words.length; wordIdx++) {
      const word = words[wordIdx];
      const wordWeight = 1.0 / Math.sqrt(wordIdx + 1);

      // 1. Whole-word feature
      const wordHash = fnv1a(`W:${word}`) % this.dimension;
      vector[wordHash] += 2.0 * wordWeight;

      // 2. Word boundary markers for character n-grams
      const boundedWord = `<${word}>`;

      // Character 2-grams, 3-grams, and 4-grams
      for (let n = 2; n <= 4; n++) {
        for (let i = 0; i <= boundedWord.length - n; i++) {
          const gram = boundedWord.substring(i, i + n);
          const gramHash = fnv1a(`G${n}:${gram}`) % this.dimension;
          const isPrefix = i === 0;
          const gramWeight = (isPrefix ? 1.5 : 1.0) * (n === 3 ? 1.2 : 1.0) * wordWeight;
          vector[gramHash] += gramWeight;
        }
      }

      // 3. Single-character initial marker
      if (word.length === 1) {
        const initHash = fnv1a(`INIT:${word}`) % this.dimension;
        vector[initHash] += 2.5 * wordWeight;
      }
    }

    return normalizeInPlace(vector);
  }

  async generateBatchEmbeddings(texts: string[]): Promise<Float32Array[]> {
    return Promise.all(texts.map(t => this.generateEmbedding(t)));
  }

  computeCosineSimilarity(vecA: Float32Array, vecB: Float32Array): number {
    return cosineSimilarityUnitNormalized(vecA, vecB);
  }
}
