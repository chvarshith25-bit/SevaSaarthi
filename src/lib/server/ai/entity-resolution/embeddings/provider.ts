/**
 * Seva Saarthi AI Model 2 - Pluggable Embedding Provider Interface
 * 
 * Defines the contract for text and entity embedding providers.
 * Designed to support current English-only optimized subword/n-gram vectorizers
 * while enabling future seamless drop-in of multilingual transformer models (e.g., IndicBERT, MuRIL).
 */

export interface EmbeddingProvider {
  /**
   * Unique identifier for the embedding model / provider.
   */
  readonly modelId: string;

  /**
   * Vector dimension produced by this provider.
   */
  readonly dimension: number;

  /**
   * Generates a dense float vector embedding for a given text string.
   */
  generateEmbedding(text: string): Promise<Float32Array>;

  /**
   * Generates embeddings in batch for multiple text strings.
   */
  generateBatchEmbeddings(texts: string[]): Promise<Float32Array[]>;

  /**
   * Computes cosine similarity between two vector embeddings.
   * Returns a normalized score between 0.0 and 1.0.
   */
  computeCosineSimilarity(vecA: Float32Array, vecB: Float32Array): number;
}
