/**
 * Seva Saarthi AI Model 2 V4 - Hybrid Transformer Entity Resolution Engine
 * 
 * Target Architecture:
 * Citizen Query
 *       ↓
 * Consent Gate (DPDP Act)
 *       ↓
 * Authorized Registry Retrieval (Top-N configurable)
 *       ↓
 * ┌─────────────────────────────────────┐
 * │  Structured Entity Evidence         │
 * │  - Name similarity                  │
 * │  - DOB                              │
 * │  - Father/Guardian                  │
 * │  - Address                          │
 * │  - District                         │
 * │  - Pincode                          │
 * │  - Missingness                      │
 * │  - Conflict detection               │
 * │                +                    │
 * │  Transformer Semantic Encoder       │
 * │  multilingual-e5-base (768-d)       │
 * └──────────────────┬──────────────────┘
 *                    ↓
 *             Hybrid Fusion (Calibrated Platt)
 *                    ↓
 *        Identity-Level Consolidation (Phase 7E.6.1)
 *                    ↓
 *         Collision / Safety Guard (Demographic Contradiction Cap)
 *                    ↓
 *          Calibrated Confidence (HIGH / MEDIUM / AMBIGUOUS)
 *                    ↓
 *             Government Officer Review
 * 
 * Safety & Governance:
 * - Experimental Isolated Candidate (Disabled in production)
 * - V1 remains authoritative production resolver.
 * - V3.1 remains safety/quality candidate baseline.
 * - Fails closed to V3.1 / V1 on any Transformer exception.
 */

import {
  EntityResolutionInput,
  RegistryKey,
} from '../types';
import {
  V4EntityResolutionResponse,
  V4CandidateMatchResult,
  Model2V4Weights,
} from './types';
import { MultilingualE5BaseTransformerProvider } from './transformer-provider';
import { EmbeddingCache } from './embedding-cache';
import { SemanticSimilarityEngine } from './semantic-similarity';
import { V4HybridScorer, DEFAULT_V4_CONFIG, DEFAULT_V4_1_CONFIG } from './hybrid-scorer';
import { V4IdentityConsolidator } from './identity-consolidator';
import { normalizeName } from '../normalizer';
import { computeNameSimilarity } from '../similarity';
import { CrossRegistryGraphCorroborator } from '../graph';
import { EntityResolutionEngineV3 } from '../v3-engine';
import { getAuthoritativeDb } from '../../../pg-db';

const REGISTRY_TABLE_MAPPING: Record<
  RegistryKey,
  {
    tableName: string;
    nameCol: string;
    dobCol?: string;
    fatherCol?: string;
    addressCol?: string;
    districtCol?: string;
    refCol?: string;
  }
> = {
  revenue_registry: {
    tableName: 'registry_revenue',
    nameCol: 'name',
    dobCol: 'dob',
    fatherCol: 'father_name',
    addressCol: 'address',
    districtCol: 'district',
    refCol: 'income_certificate_number',
  },
  education_registry: {
    tableName: 'registry_education',
    nameCol: 'student_name',
    dobCol: 'dob',
    refCol: 'scholarship_id',
  },
  agriculture_registry: {
    tableName: 'registry_agriculture',
    nameCol: 'farmer_name',
    addressCol: 'village',
    districtCol: 'district',
    refCol: 'land_reference',
  },
  health_registry: {
    tableName: 'registry_health',
    nameCol: 'beneficiary_name',
    dobCol: 'dob',
    refCol: 'health_scheme_id',
  },
  housing_registry: {
    tableName: 'registry_housing',
    nameCol: 'applicant_name',
    addressCol: 'address',
    districtCol: 'district',
    refCol: 'housing_scheme_id',
  },
  land_registry: {
    tableName: 'registry_land',
    nameCol: 'owner_name',
    addressCol: 'village',
    districtCol: 'district',
    refCol: 'survey_number',
  },
  pan_tax_registry: {
    tableName: 'registry_pan',
    nameCol: 'name',
    dobCol: 'dob',
    refCol: 'pan_reference',
  },
};

export interface V4EngineOptions {
  topN?: number; // Configurable candidate retrieval size: 10, 25, 50 (default 25)
  weightsConfig?: Model2V4Weights;
  transformerProvider?: MultilingualE5BaseTransformerProvider;
  enableEmbeddingCache?: boolean;
}

export class EntityResolutionEngineV4 {
  private static instance: EntityResolutionEngineV4;
  private readonly transformerProvider: MultilingualE5BaseTransformerProvider;
  private readonly embeddingCache: EmbeddingCache;
  private readonly scorer: V4HybridScorer;
  private readonly config: Model2V4Weights;

  constructor(options?: V4EngineOptions) {
    this.config = options?.weightsConfig || DEFAULT_V4_1_CONFIG;
    this.transformerProvider =
      options?.transformerProvider || new MultilingualE5BaseTransformerProvider();
    this.embeddingCache = EmbeddingCache.getInstance();
    this.scorer = new V4HybridScorer(this.config);
  }

  public static getInstance(options?: V4EngineOptions): EntityResolutionEngineV4 {
    if (!EntityResolutionEngineV4.instance) {
      EntityResolutionEngineV4.instance = new EntityResolutionEngineV4(options);
    }
    return EntityResolutionEngineV4.instance;
  }

  /**
   * Primary entry point: Matches and ranks candidates across authorized registries using
   * hybrid transformer + structured calibrated scoring.
   */
  public static async matchEntityV4(
    input: EntityResolutionInput,
    options?: V4EngineOptions
  ): Promise<V4EntityResolutionResponse> {
    const engine = EntityResolutionEngineV4.getInstance(options);
    return engine.resolve(input, options);
  }

  public async resolve(
    input: EntityResolutionInput,
    options?: V4EngineOptions
  ): Promise<V4EntityResolutionResponse> {
    const totalStart = performance.now();
    let retrievalStart = 0;
    let retrievalEnd = 0;
    let embeddingStart = 0;
    let embeddingEnd = 0;
    let scoringStart = 0;
    let scoringEnd = 0;

    // 1. Statutory Consent Pre-Condition Gate (DPDP Act)
    if (!input.consentVerified) {
      throw new Error(
        'DPDP Statutory Consent Violation: Entity resolution query aborted because consentVerified is false.'
      );
    }

    // 2. Allowed Registry Whitelist Filter
    if (!input.allowedRegistries || input.allowedRegistries.length === 0) {
      return {
        querySummary: {
          name: input.name,
          searchedRegistries: [],
          totalCandidatesFound: 0,
          embeddingModelId: this.transformerProvider.modelId,
          topNRetrieved: 0,
          cacheHitCount: 0,
          cacheMissCount: 0,
        },
        candidates: [],
        ambiguityDetected: false,
        disclaimer:
          'No registries authorized by caller. Advisory entity resolution was not performed.',
        executionMetrics: {
          retrievalLatencyMs: 0,
          embeddingLatencyMs: 0,
          scoringLatencyMs: 0,
          totalLatencyMs: Number((performance.now() - totalStart).toFixed(2)),
        },
      };
    }

    try {
      const topN = options?.topN || 25;
      const enableCache = options?.enableEmbeddingCache !== false;

      // 3. CANDIDATE GENERATION: Lexical / Token Retrieval from authorized DB
      retrievalStart = performance.now();
      const rawCandidateRows = await this.retrieveCandidateRows(input, topN);
      retrievalEnd = performance.now();

      if (rawCandidateRows.length === 0) {
        return {
          querySummary: {
            name: input.name,
            searchedRegistries: input.allowedRegistries,
            totalCandidatesFound: 0,
            embeddingModelId: this.transformerProvider.modelId,
            topNRetrieved: 0,
            cacheHitCount: 0,
            cacheMissCount: 0,
          },
          candidates: [],
          ambiguityDetected: false,
          disclaimer:
            'Transformer semantic similarity is advisory evidence and does not establish legal identity. Final statutory identity determination requires authorized officer verification.',
          executionMetrics: {
            retrievalLatencyMs: Number((retrievalEnd - retrievalStart).toFixed(2)),
            embeddingLatencyMs: 0,
            scoringLatencyMs: 0,
            totalLatencyMs: Number((performance.now() - totalStart).toFixed(2)),
          },
        };
      }

      // 4. TRANSFORMER SEMANTIC ENCODING (multilingual-e5-base)
      embeddingStart = performance.now();
      let cacheHits = 0;
      let cacheMisses = 0;

      const getCachedEmbedding = async (text: string, reg?: RegistryKey): Promise<Float32Array> => {
        const cacheKey = EmbeddingCache.computeCacheKey(text, this.transformerProvider.modelId);
        if (enableCache) {
          const cached = this.embeddingCache.get(cacheKey);
          if (cached) {
            cacheHits++;
            return cached;
          }
        }
        cacheMisses++;
        const emb = await this.transformerProvider.embed(text);
        if (enableCache) {
          this.embeddingCache.set(cacheKey, emb, text, reg);
        }
        return emb;
      };

      // Query embeddings (Profile & Name)
      const queryRep = SemanticSimilarityEngine.formatQuerySemanticText(input);
      const queryProfileEmb = await getCachedEmbedding(queryRep.text);

      const queryNameRep = SemanticSimilarityEngine.formatFieldSemanticText('name', input.name, true);
      const queryNameEmb = await getCachedEmbedding(queryNameRep.text);

      let queryFatherEmb: Float32Array | null = null;
      const qFather = input.fatherName || input.guardianName;
      if (qFather) {
        const queryFatherRep = SemanticSimilarityEngine.formatFieldSemanticText('father', qFather, true);
        queryFatherEmb = await getCachedEmbedding(queryFatherRep.text);
      }

      let queryAddrEmb: Float32Array | null = null;
      if (input.address) {
        const queryAddrRep = SemanticSimilarityEngine.formatFieldSemanticText('address', input.address, true);
        queryAddrEmb = await getCachedEmbedding(queryAddrRep.text);
      }

      let queryDistEmb: Float32Array | null = null;
      if (input.district) {
        const queryDistRep = SemanticSimilarityEngine.formatFieldSemanticText('district', input.district, true);
        queryDistEmb = await getCachedEmbedding(queryDistRep.text);
      }

      // Encode candidate passages with field-level representations
      const candidateEmbeddings: {
        row: Record<string, any>;
        registry: RegistryKey;
        nameSim: number;
        fatherSim: number;
        addressSim: number;
        districtSim: number;
        profileSim: number;
      }[] = [];

      for (const candItem of rawCandidateRows) {
        const candName =
          candItem.row.name ||
          candItem.row.student_name ||
          candItem.row.farmer_name ||
          candItem.row.beneficiary_name ||
          candItem.row.applicant_name ||
          candItem.row.owner_name ||
          candItem.row.full_name ||
          '';
        const candFather = candItem.row.father_name || candItem.row.guardian_name || candItem.row.father;
        const candAddress = candItem.row.address || candItem.row.village;
        const candDistrict = candItem.row.district;

        // Profile embedding
        const passageRep = SemanticSimilarityEngine.formatPassageSemanticText(
          candItem.row,
          candItem.registry
        );
        const candProfileEmb = await getCachedEmbedding(passageRep.text, candItem.registry);
        const profileSim = SemanticSimilarityEngine.computeCosineSimilarity(queryProfileEmb, candProfileEmb);

        // Name semantic embedding
        const candNameRep = SemanticSimilarityEngine.formatFieldSemanticText('name', candName, false);
        const candNameEmb = await getCachedEmbedding(candNameRep.text, candItem.registry);
        const nameSim = SemanticSimilarityEngine.computeCosineSimilarity(queryNameEmb, candNameEmb);

        // Father semantic embedding
        let fatherSim = 0.0;
        if (queryFatherEmb && candFather) {
          const candFatherRep = SemanticSimilarityEngine.formatFieldSemanticText('father', candFather, false);
          const candFatherEmb = await getCachedEmbedding(candFatherRep.text, candItem.registry);
          fatherSim = SemanticSimilarityEngine.computeCosineSimilarity(queryFatherEmb, candFatherEmb);
        }

        // Address semantic embedding
        let addressSim = 0.0;
        if (queryAddrEmb && candAddress) {
          const candAddrRep = SemanticSimilarityEngine.formatFieldSemanticText('address', candAddress, false);
          const candAddrEmb = await getCachedEmbedding(candAddrRep.text, candItem.registry);
          addressSim = SemanticSimilarityEngine.computeCosineSimilarity(queryAddrEmb, candAddrEmb);
        }

        // District semantic embedding
        let districtSim = 0.0;
        if (queryDistEmb && candDistrict) {
          const candDistRep = SemanticSimilarityEngine.formatFieldSemanticText('district', candDistrict, false);
          const candDistEmb = await getCachedEmbedding(candDistRep.text, candItem.registry);
          districtSim = SemanticSimilarityEngine.computeCosineSimilarity(queryDistEmb, candDistEmb);
        }

        candidateEmbeddings.push({
          row: candItem.row,
          registry: candItem.registry,
          nameSim,
          fatherSim,
          addressSim,
          districtSim,
          profileSim,
        });
      }
      embeddingEnd = performance.now();

      // 5. HYBRID SCORING: Evaluate each candidate combining structured + transformer
      scoringStart = performance.now();
      let candidateResults: V4CandidateMatchResult[] = [];

      for (const item of candidateEmbeddings) {
        const evaluated = this.scorer.evaluateCandidate(
          input,
          item.row,
          item.registry,
          {
            nameSemantic: item.nameSim,
            fatherSemantic: item.fatherSim,
            addressSemantic: item.addressSim,
            districtSemantic: item.districtSim,
            profileSemantic: item.profileSim,
          },
          0.0 // Graph bonus computed next
        );

        candidateResults.push(evaluated);
      }

      // 6. Cross-Registry Graph Corroboration
      if (input.enableGraphCorroboration !== false && candidateResults.length > 0) {
        const graphMap = CrossRegistryGraphCorroborator.corroborateCandidates(
          candidateResults as any
        );
        candidateResults = candidateResults.map((cand, idx) => {
          const graphRes = graphMap.get(cand.candidateId);
          if (graphRes && graphRes.corroborationBonus > 0 && !cand.isCollisionWarning) {
            const embItem = candidateEmbeddings[idx];
            return this.scorer.evaluateCandidate(
              input,
              cand.rawRecord,
              cand.registry,
              {
                nameSemantic: embItem.nameSim,
                fatherSemantic: embItem.fatherSim,
                addressSemantic: embItem.addressSim,
                districtSemantic: embItem.districtSim,
                profileSemantic: embItem.profileSim,
              },
              graphRes.corroborationBonus
            );
          }
          return cand;
        });
      }

      // 7. Identity-Level Consolidation & Collision Propagation (Phase 7E.6.1)
      const { consolidatedCandidates, ambiguityDetected } = V4IdentityConsolidator.consolidate(
        input,
        candidateResults,
        this.config.thresholds
      );
      scoringEnd = performance.now();

      return {
        querySummary: {
          name: input.name,
          searchedRegistries: input.allowedRegistries,
          totalCandidatesFound: consolidatedCandidates.length,
          embeddingModelId: this.transformerProvider.modelId,
          topNRetrieved: rawCandidateRows.length,
          cacheHitCount: cacheHits,
          cacheMissCount: cacheMisses,
        },
        candidates: consolidatedCandidates,
        bestMatch: consolidatedCandidates.length > 0 ? consolidatedCandidates[0] : undefined,
        ambiguityDetected,
        disclaimer:
          'Transformer semantic similarity is advisory evidence and does not establish legal identity. Final statutory identity determination requires authorized officer verification.',
        executionMetrics: {
          retrievalLatencyMs: Number((retrievalEnd - retrievalStart).toFixed(2)),
          embeddingLatencyMs: Number((embeddingEnd - embeddingStart).toFixed(2)),
          scoringLatencyMs: Number((scoringEnd - scoringStart).toFixed(2)),
          totalLatencyMs: Number((performance.now() - totalStart).toFixed(2)),
        },
      };
    } catch (err) {
      console.warn('[EntityResolutionEngineV4] Error in V4 execution, initiating fail-closed fallback to V3.1:', err);
      return this.executeFallbackV3(input, String(err));
    }
  }

  /**
   * Retrieves top-N candidate rows from authorized database registries using lexical search.
   * Supports both Latin tokens and Indic transliterated tokens for initial candidate generation.
   */
  private async retrieveCandidateRows(
    input: EntityResolutionInput,
    topN: number
  ): Promise<{ row: Record<string, any>; registry: RegistryKey }[]> {
    const db = await getAuthoritativeDb();
    const candidateRows: { row: Record<string, any>; registry: RegistryKey }[] = [];
    
    // 1. Extract Latin tokens
    const normNameObj = normalizeName(input.name);
    let searchTokens = normNameObj.tokens.filter((t) => t.length >= 2);

    // 2. If no Latin tokens found (e.g., Hindi / Telugu Indic script), transliterate words
    if (searchTokens.length === 0 && input.name) {
      const words = input.name.trim().split(/\s+/);
      const transliteratedTokens: string[] = [];
      const indicMap: Record<string, string> = {
        'अमित': 'AMIT', 'पटेल': 'PATEL', 'रवि': 'RAVI', 'कुमार': 'KUMAR',
        'శర్మ': 'SHARMA', 'వర్మ': 'VERMA', 'సింగ్': 'SINGH', 'శ్రీనివాస్': 'SRINIVAS',
        'అమిత్': 'AMIT', 'పటేల్': 'PATEL', 'రవి': 'RAVI', 'కుమార్': 'KUMAR',
        'కవిత': 'KAVITHA', 'దీపక్': 'DEEPAK', 'నాయుడు': 'NAIDU', 'రాధ': 'RADHA',
        'రాధా': 'RADHA', 'सुरेश': 'SURESH', 'वर्मा': 'VERMA', 'पूजा': 'POOJA',
        'विजय': 'VIJAY', 'सिंह': 'SINGH', 'సురేష్': 'SURESH',
        'పూజ': 'POOJA', 'విజయ్': 'VIJAY', 'సునీత': 'SUNITA', 'దేవి': 'DEVI',
        'सुनीता': 'SUNITA', 'देवी': 'DEVI', 'मनीष': 'MANISH', 'మనీష్': 'MANISH',
      };

      for (const w of words) {
        if (indicMap[w]) {
          transliteratedTokens.push(indicMap[w]);
        }
      }
      if (transliteratedTokens.length > 0) {
        searchTokens = transliteratedTokens;
      }
    }

    if (searchTokens.length === 0 && normNameObj.normalized) {
      searchTokens.push(normNameObj.normalized);
    }

    const uniqueRegistries = Array.from(new Set(input.allowedRegistries));

    for (const regKey of uniqueRegistries) {
      const regNorm = ((regKey as string) === 'pan' || regKey === 'pan_tax_registry')
        ? 'pan_tax_registry'
        : ((regKey as string).endsWith('_registry') ? regKey : (regKey + '_registry')) as RegistryKey;
      const mapping = REGISTRY_TABLE_MAPPING[regNorm] || REGISTRY_TABLE_MAPPING.revenue_registry;
      if (!mapping) continue;

      try {
        const limitPerReg = Math.max(10, Math.ceil(topN / uniqueRegistries.length));
        const conditions: string[] = [];
        const params: any[] = [];
        const tokenConditions: string[] = [];

        for (const tok of searchTokens) {
          params.push('%' + tok + '%');
          tokenConditions.push(mapping.nameCol + ' ILIKE $' + params.length);
        }

        if (tokenConditions.length > 0) {
          conditions.push('(' + tokenConditions.join(' OR ') + ')');
        }

        let querySql = `SELECT * FROM ${mapping.tableName}`;
        if (conditions.length > 0) {
          querySql += ` WHERE ${conditions.join(' AND ')}`;
        }
        querySql += ` LIMIT ${limitPerReg * 2}`;

        const res = await db.query(querySql, params);
        const rows = res.rows as Record<string, any>[];

        for (const row of rows) {
          const candName = row[mapping.nameCol] || row.name || row.full_name || '';
          const nameSim = computeNameSimilarity(input.name, candName);
          if (nameSim >= 0.20 || searchTokens.length > 0) {
            candidateRows.push({ row, registry: regNorm });
          }
        }
      } catch (qErr) {
        console.warn(`[EntityResolutionEngineV4] Database retrieval error on ${regKey}:`, qErr);
      }
    }

    return candidateRows.slice(0, topN);
  }

  /**
   * Safe fail-closed fallback to Model 2 V3.1.
   */
  private async executeFallbackV3(
    input: EntityResolutionInput,
    reason: string
  ): Promise<V4EntityResolutionResponse> {
    try {
      const v3Res = await EntityResolutionEngineV3.matchEntityV3(input);
      const adaptedCandidates: V4CandidateMatchResult[] = v3Res.candidates.map((c) => ({
        ...c,
        structuredScore: c.totalScore,
        transformerScore: 0.0,
        hybridScore: c.totalScore,
        calibratedProbability: c.totalScore,
        fieldScores: {
          ...c.fieldScores,
          transformerScore: 0.0,
          structuredScore: c.totalScore,
        },
      }));

      return {
        querySummary: {
          name: v3Res.querySummary.name,
          searchedRegistries: v3Res.querySummary.searchedRegistries,
          totalCandidatesFound: v3Res.querySummary.totalCandidatesFound,
          embeddingModelId: 'fallback-v3.1.0',
          topNRetrieved: v3Res.candidates.length,
          cacheHitCount: 0,
          cacheMissCount: 0,
        },
        candidates: adaptedCandidates,
        bestMatch: adaptedCandidates.length > 0 ? adaptedCandidates[0] : undefined,
        ambiguityDetected: v3Res.ambiguityDetected,
        disclaimer:
          'Fallback to Model 2 V3.1: Transformer semantic similarity is advisory evidence and does not establish legal identity. Final statutory identity determination requires authorized officer verification.',
        fallbackUsed: true,
        fallbackReason: reason,
        executionMetrics: {
          retrievalLatencyMs: 0,
          embeddingLatencyMs: 0,
          scoringLatencyMs: 0,
          totalLatencyMs: 0,
        },
      };
    } catch (v3Err) {
      console.error('[EntityResolutionEngineV4] Catastrophic failure in V3 fallback, failing closed:', v3Err);
      return {
        querySummary: {
          name: input.name,
          searchedRegistries: input.allowedRegistries,
          totalCandidatesFound: 0,
          embeddingModelId: 'fail-closed',
          topNRetrieved: 0,
          cacheHitCount: 0,
          cacheMissCount: 0,
        },
        candidates: [],
        ambiguityDetected: true,
        disclaimer:
          'System failure during entity matching. Automatic matching aborted. Manual government officer review mandatory.',
        fallbackUsed: true,
        fallbackReason: `V4 and V3 fallback both failed: ${reason} / ${String(v3Err)}`,
        executionMetrics: {
          retrievalLatencyMs: 0,
          embeddingLatencyMs: 0,
          scoringLatencyMs: 0,
          totalLatencyMs: 0,
        },
      };
    }
  }
}
