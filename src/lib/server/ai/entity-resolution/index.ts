export * from './types';
export * from './normalizer';
export * from './similarity';
export * from './candidate-retriever';
export * from './scorer';
export * from './engine';
export * from './v2-engine';
export * from './v3-engine';
export * from './shadow-matcher';
export * from './embeddings';
export * from './graph';

export { EntityResolutionEngine } from './engine';
export { EntityResolutionEngineV2 } from './v2-engine';
export { EntityResolutionEngineV3, EXPECTED_V3_FEATURE_NAMES } from './v3-engine';
export { EntityResolutionShadowMatcher } from './shadow-matcher';
export { ENTITY_RESOLUTION_THRESHOLDS } from './types';
export { evaluateCandidate } from './scorer';
export {
  normalizeText,
  normalizeName,
  normalizeDate,
  normalizeAddress,
  normalizePincode,
} from './normalizer';
export {
  jaroSimilarity,
  jaroWinklerSimilarity,
  tokenJaccardSimilarity,
  computeNameSimilarity,
  computeDobSimilarity,
  computeAddressSimilarity,
  computeDistrictSimilarity,
  computePincodeSimilarity,
} from './similarity';
export {
  EnglishNgramEmbedder,
  getEmbeddingProvider,
  setEmbeddingProvider,
} from './embeddings';
export {
  CrossRegistryGraphCorroborator,
} from './graph';

export {
  EntityResolutionEngineV4,
  MultilingualE5BaseTransformerProvider,
  EmbeddingCache,
  SemanticSimilarityEngine,
  V4HybridScorer,
  V4CollisionGuard,
  V4IdentityConsolidator,
  DEFAULT_V4_CONFIG,
  EXPECTED_V4_FEATURE_NAMES,
} from './v4-transformer';
export type {
  Model2V4Weights,
  V4CandidateMatchResult,
  V4EntityResolutionResponse,
  V4FieldSimilarityScores,
  SemanticRepresentation,
  V4EngineOptions,
} from './v4-transformer';
