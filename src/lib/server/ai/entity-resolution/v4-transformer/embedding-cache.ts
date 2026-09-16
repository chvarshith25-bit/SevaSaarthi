/**
 * Seva Saarthi AI Model 2 V4 - Safe Embedding Cache
 * 
 * Provides high-performance in-memory LRU caching of 768-dimensional Transformer embeddings
 * keyed by SHA-256 hash of normalized semantic text and model version.
 * 
 * Safety & Privacy:
 * - Strictly prohibits caching of raw sensitive identifiers (Aadhaar, PAN, bank secrets, passwords)
 * - Transparent cache statistics (hits, misses, evictions)
 * - Safe invalidation mechanisms for record updates
 */

import * as crypto from 'crypto';

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalCached: number;
  maxCapacity: number;
}

const SENSITIVE_PATTERNS = [
  /aadhaar/i,
  /uidai/i,
  /\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b/, // 12-digit Aadhaar pattern
  /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/,   // 10-char PAN pattern
  /pan_number/i,
  /bank_account/i,
  /ifsc/i,
  /password/i,
  /secret/i,
  /auth_token/i,
];

export class EmbeddingCache {
  private static instance: EmbeddingCache;
  private readonly maxCapacity: number;
  private readonly cache: Map<string, { embedding: Float32Array; registry?: string; lastAccessed: number }>;
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(maxCapacity = 10000) {
    this.maxCapacity = maxCapacity;
    this.cache = new Map();
  }

  public static getInstance(maxCapacity = 10000): EmbeddingCache {
    if (!EmbeddingCache.instance) {
      EmbeddingCache.instance = new EmbeddingCache(maxCapacity);
    }
    return EmbeddingCache.instance;
  }

  /**
   * Generates a stable SHA-256 cache key from normalized semantic text and model version.
   */
  public static computeCacheKey(normalizedText: string, modelVersion: string): string {
    const input = `${modelVersion.trim()}::${normalizedText.trim().toLowerCase()}`;
    return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
  }

  /**
   * Retrieves a cached embedding if available.
   */
  public get(key: string): Float32Array | null {
    const entry = this.cache.get(key);
    if (entry) {
      entry.lastAccessed = Date.now();
      this.hits++;
      return entry.embedding;
    }
    this.misses++;
    return null;
  }

  /**
   * Stores an embedding in the cache. Verifies that the source text contains no raw sensitive secrets.
   */
  public set(
    key: string,
    embedding: Float32Array,
    semanticTextForAudit: string,
    registry?: string
  ): boolean {
    // DPDP Safety Check: Refuse caching if text contains raw sensitive identifiers
    if (this.containsSensitiveData(semanticTextForAudit)) {
      console.warn('[EmbeddingCache] Blocked caching: semantic text contains potential sensitive identifiers.');
      return false;
    }

    // LRU eviction if capacity reached
    if (this.cache.size >= this.maxCapacity && !this.cache.has(key)) {
      this.evictOldest();
    }

    this.cache.set(key, {
      embedding,
      registry,
      lastAccessed: Date.now(),
    });
    return true;
  }

  /**
   * Checks if an entry exists in the cache.
   */
  public has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Invalidates a specific cache entry.
   */
  public invalidate(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalidates all cached embeddings associated with a specific registry.
   */
  public invalidateByRegistry(registry: string): number {
    let count = 0;
    for (const [k, v] of this.cache.entries()) {
      if (v.registry === registry) {
        this.cache.delete(k);
        count++;
      }
    }
    return count;
  }

  /**
   * Clears the entire cache.
   */
  public clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * Returns cache metrics.
   */
  public getStats(): CacheStats {
    return {
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      totalCached: this.cache.size,
      maxCapacity: this.maxCapacity,
    };
  }

  /**
   * Evicts the least recently accessed item.
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.evictions++;
    }
  }

  /**
   * Audits semantic text to prevent caching raw sensitive identifiers.
   */
  private containsSensitiveData(text: string): boolean {
    if (!text) return false;
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(text)) {
        return true;
      }
    }
    return false;
  }
}
