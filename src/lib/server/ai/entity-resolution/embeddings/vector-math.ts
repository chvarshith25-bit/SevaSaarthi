/**
 * Seva Saarthi AI Model 2 - Vector Math Operations
 * 
 * High-performance vector operations (L2 normalization, cosine similarity, Euclidean distance)
 * optimized for dense float arrays.
 */

/**
 * Computes the Euclidean norm (L2 norm) of a vector.
 */
export function l2Norm(vec: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i];
  }
  return Math.sqrt(sum);
}

/**
 * Normalizes a vector in-place to unit length (L2 norm = 1.0).
 */
export function normalizeInPlace(vec: Float32Array): Float32Array {
  const norm = l2Norm(vec);
  if (norm === 0) return vec;
  const invNorm = 1 / norm;
  for (let i = 0; i < vec.length; i++) {
    vec[i] *= invNorm;
  }
  return vec;
}

/**
 * Returns a new unit-normalized vector.
 */
export function normalizeVector(vec: Float32Array): Float32Array {
  const copy = new Float32Array(vec);
  return normalizeInPlace(copy);
}

/**
 * Computes dot product between two vectors.
 */
export function dotProduct(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

/**
 * Computes cosine similarity between two vectors.
 * Returns a value bounded between 0.0 and 1.0.
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }
  const normA = l2Norm(a);
  const normB = l2Norm(b);
  if (normA === 0 || normB === 0) return 0;
  const rawCos = dotProduct(a, b) / (normA * normB);
  // Clamp between 0.0 and 1.0 for entity similarity
  return Math.max(0, Math.min(1, (rawCos + 1) / 2));
}

/**
 * Computes exact cosine similarity assuming vectors are already unit-normalized.
 */
export function cosineSimilarityUnitNormalized(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }
  const rawCos = dotProduct(a, b);
  return Math.max(0, Math.min(1, (rawCos + 1) / 2));
}
