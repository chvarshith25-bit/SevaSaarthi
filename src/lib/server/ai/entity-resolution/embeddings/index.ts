export * from './provider';
export * from './vector-math';
export * from './ngram-embedder';

import { EmbeddingProvider } from './provider';
import { EnglishNgramEmbedder } from './ngram-embedder';

let defaultProvider: EmbeddingProvider = new EnglishNgramEmbedder();

export function getEmbeddingProvider(): EmbeddingProvider {
  return defaultProvider;
}

export function setEmbeddingProvider(provider: EmbeddingProvider): void {
  defaultProvider = provider;
}
