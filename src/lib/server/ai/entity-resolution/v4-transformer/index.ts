/**
 * Seva Saarthi AI Model 2 V4 - Hybrid Transformer Entity Resolution Module
 * Pretrained Transformer: intfloat/multilingual-e5-base (768 dimensions, 12 layers)
 */

export * from './types';
export * from './transformer-provider';
export * from './embedding-cache';
export * from './semantic-similarity';
export * from './hybrid-scorer';
export * from './collision-guard';
export * from './identity-consolidator';
export * from './language-router';
export * from './selective-gater';
export * from './v4-engine';

export { MultilingualE5BaseTransformerProvider } from './transformer-provider';
export { EmbeddingCache } from './embedding-cache';
export { SemanticSimilarityEngine } from './semantic-similarity';
export { V4HybridScorer, DEFAULT_V4_CONFIG, DEFAULT_V4_1_CONFIG, DEFAULT_V4_2_CONFIG } from './hybrid-scorer';
export { V4CollisionGuard } from './collision-guard';
export { V4IdentityConsolidator } from './identity-consolidator';
export { LanguageRouter } from './language-router';
export { SelectiveGater } from './selective-gater';
export { EntityResolutionEngineV4 } from './v4-engine';
