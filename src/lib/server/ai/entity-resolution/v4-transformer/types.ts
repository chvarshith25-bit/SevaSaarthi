/**
 * Seva Saarthi AI Model 2 V4 - Hybrid Transformer Entity Resolution Types
 * Phase 7F: Multilingual-E5-Base Transformer + Calibrated Structured Evidence
 */

import { RegistryKey, MatchConfidenceTier, FieldSimilarityScores } from '../types';

export interface EmbeddingProvider {
  /**
   * Unique identifier for the embedding model / provider.
   * e.g., 'intfloat/multilingual-e5-base'
   */
  readonly modelId: string;

  /**
   * Vector dimension produced by this provider (768 for multilingual-e5-base).
   */
  readonly dimension: number;

  /**
   * Max token sequence length supported by the model (approx 512 tokens).
   */
  readonly maxTokens?: number;

  /**
   * Generates a 768-dimensional dense float vector for a given text string.
   */
  embed(text: string): Promise<Float32Array>;

  /**
   * Generates embeddings in batch for multiple text strings.
   */
  embedBatch(texts: string[]): Promise<Float32Array[]>;

  /**
   * Computes cosine similarity between two vector embeddings (0.0 to 1.0).
   */
  similarity(vectorA: Float32Array, vectorB: Float32Array): number;

  // Backward/forward compatibility aliases
  generateEmbedding?(text: string): Promise<Float32Array>;
  generateBatchEmbeddings?(texts: string[]): Promise<Float32Array[]>;
  computeCosineSimilarity?(vecA: Float32Array, vecB: Float32Array): number;
}

export type FusionStrategy =
  | 'STRUCTURED_ONLY'                 // Strategy A: V3.1 structured evidence only
  | 'TRANSFORMER_ONLY'                // Strategy B: Pure transformer cosine similarity
  | 'LINEAR_90_10'                    // Strategy C: 0.90 structured + 0.10 transformer
  | 'LINEAR_80_20'                    // Strategy D: 0.80 structured + 0.20 transformer
  | 'LINEAR_70_30'                    // 0.70 structured + 0.30 transformer
  | 'LINEAR_60_40'                    // 0.60 structured + 0.40 transformer
  | 'CONDITIONAL_MEDIUM_AMBIGUOUS'   // Strategy E: Conditional transformer for MEDIUM/AMBIGUOUS only
  | 'CONDITIONAL_MULTILINGUAL_ONLY'   // Strategy F: Conditional transformer for multilingual only
  | 'CONDITIONAL_SELECTIVE'           // Strategy G: V4.2 Selective Transformer Gating (Multilingual + Uncertain)
  | 'LEARNED_FUSION';                 // Strategy H: Learned field-aware hybrid fusion layer

export interface Model2V4Weights {
  version: string;
  model_name: string;
  model_type: string;
  transformer_model_id: string;
  transformer_dimension: number;
  feature_names: string[];
  weights: number[];
  bias: number;
  temperature: number;
  fusion_strategy?: FusionStrategy;
  fusion_coefficients: {
    alpha_structured: number;
    beta_transformer: number;
    gamma_graph: number;
    conflict_penalty_weight: number;
  };
  thresholds: {
    HIGH_CONFIDENCE: number;
    MEDIUM_CONFIDENCE: number;
    LOW_CONFIDENCE: number;
    HARD_CONFLICT_CAP: number;
    AMBIGUITY_SCORE_DELTA: number;
  };
}

export const EXPECTED_V4_FEATURE_NAMES = [
  'name_similarity',
  'initials_compatibility',
  'dob_similarity',
  'father_similarity',
  'address_similarity',
  'district_similarity',
  'pincode_similarity',
  'transformer_e5_similarity',
  'graph_corroboration',
  'available_field_count',
  'conflicting_field_count',
  'missing_dob',
  'missing_father',
  'missing_address',
  'missing_district',
  'missing_pincode',
];

export const EXPECTED_V4_1_FEATURE_NAMES = [
  'name_similarity',
  'initials_compatibility',
  'dob_similarity',
  'father_similarity',
  'address_similarity',
  'district_similarity',
  'pincode_similarity',
  'ngram_similarity',
  'graph_corroboration',
  'available_field_count',
  'conflicting_field_count',
  'missing_dob',
  'missing_father',
  'missing_address',
  'missing_district',
  'missing_pincode',
  'transformer_name_similarity',
  'transformer_address_similarity',
  'transformer_district_similarity',
  'transformer_profile_similarity',
];

export interface V4FieldSimilarityScores extends FieldSimilarityScores {
  transformerScore: number;  // 0.0 - 1.0 (multilingual-e5-base cosine similarity)
  structuredScore: number;   // 0.0 - 1.0 (composite demographic structured similarity)
  nameSemanticScore?: number;
  addressSemanticScore?: number;
  districtSemanticScore?: number;
  profileSemanticScore?: number;
}

export interface V4CandidateMatchResult {
  candidateId: string;
  citizenId?: string;
  registry: RegistryKey;
  matchedFields: string[];
  fieldScores: V4FieldSimilarityScores;
  structuredScore: number;
  transformerScore: number;
  hybridScore: number;
  calibratedProbability: number;
  totalScore: number;
  confidenceTier: MatchConfidenceTier;
  isCollisionWarning: boolean;
  collisionReason?: string;
  corroborationReason?: string;
  supportingRegistries?: RegistryKey[];
  supportingRecordIds?: string[];
  identityRecordCount?: number;
  gatingDecision?: {
    mode: string;
    alphaStructured: number;
    betaTransformer: number;
    reason: string;
    detectedLanguage: string;
    isMultilingual: boolean;
  };
  explanation: string;
  rawRecord: Record<string, any>;
}

export interface V4EntityResolutionResponse {
  querySummary: {
    name: string;
    searchedRegistries: RegistryKey[];
    totalCandidatesFound: number;
    embeddingModelId: string;
    topNRetrieved: number;
    cacheHitCount: number;
    cacheMissCount: number;
  };
  candidates: V4CandidateMatchResult[];
  bestMatch?: V4CandidateMatchResult;
  ambiguityDetected: boolean;
  disclaimer: string;
  fallbackUsed?: boolean;
  fallbackReason?: string;
  executionMetrics: {
    retrievalLatencyMs: number;
    embeddingLatencyMs: number;
    scoringLatencyMs: number;
    totalLatencyMs: number;
  };
}

export interface SemanticRepresentation {
  text: string;
  contentHash: string;
  fieldCount: number;
  hasSensitiveFields: boolean;
}

export type SupportedLanguage = 'en' | 'hi' | 'te' | 'mixed' | 'transliterated_hi' | 'transliterated_te';

export interface MultilingualBenchmarkItem {
  id: string;
  queryType: string;
  language: SupportedLanguage;
  sourceText: string;
  targetText: string;
  expectedCitizenId: string;
  isMatch: boolean;
  queryMetadata?: {
    dob?: string;
    fatherName?: string;
    district?: string;
    address?: string;
  };
  candidateMetadata?: {
    dob?: string;
    fatherName?: string;
    district?: string;
    address?: string;
  };
}
