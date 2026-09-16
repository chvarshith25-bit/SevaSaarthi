/**
 * Core Entity Resolution Candidate Matching Engine (Phase 5A + Phase 5B)
 * Connects to PostgreSQL registries, enforces DPDP privacy constraints,
 * generates candidates, scores similarities with semantic embeddings,
 * performs cross-registry graph corroboration, and ranks recommendations.
 */

import {
  EntityResolutionInput,
  CandidateMatchResult,
  EntityResolutionResponse,
  RegistryKey,
  ENTITY_RESOLUTION_THRESHOLDS,
} from './types';
import { evaluateCandidate } from './scorer';
import { normalizeName } from './normalizer';
import { retrieveAuthorizedCandidates } from './candidate-retriever';
import { getEmbeddingProvider } from './embeddings';
import { CrossRegistryGraphCorroborator } from './graph';

const REGISTRY_TABLE_MAPPING: Record<RegistryKey, {
  tableName: string;
  nameCol: string;
  dobCol?: string;
  fatherCol?: string;
  addressCol?: string;
  districtCol?: string;
  refCol?: string;
}> = {
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

export class EntityResolutionEngine {
  /**
   * Primary entry point: Find and rank candidate citizen records across authorized registries.
   */
  public static async matchEntity(input: EntityResolutionInput): Promise<EntityResolutionResponse> {
    // 1. DPDP Act Pre-Condition: Statutory Citizen Consent Verification
    if (!input.consentVerified) {
      throw new Error(
        'DPDP Statutory Consent Violation: Entity resolution query aborted because consentVerified is false.'
      );
    }

    if (!input.allowedRegistries || input.allowedRegistries.length === 0) {
      return {
        querySummary: {
          name: input.name,
          searchedRegistries: [],
          totalCandidatesFound: 0,
        },
        candidates: [],
        ambiguityDetected: false,
        disclaimer: 'No registries authorized by the caller. Entity matching was not performed.',
      };
    }

    const { getAuthoritativeDb } = await import('../../pg-db');
    const db = await getAuthoritativeDb();

    const embedder = getEmbeddingProvider();
    const useEmbeddings = input.enableSemanticEmbeddings !== false;
    const useGraph = input.enableGraphCorroboration !== false;

    // Generate query embeddings if semantic embeddings are enabled
    let queryNameVec: Float32Array | null = null;
    let queryAddrVec: Float32Array | null = null;
    if (useEmbeddings) {
      queryNameVec = await embedder.generateEmbedding(input.name);
      if (input.address || input.district) {
        queryAddrVec = await embedder.generateEmbedding(`${input.address || ''} ${input.district || ''}`.trim());
      }
    }

    const norm = normalizeName(input.name);
    const searchTokens = norm.tokens.filter(t => t.length >= 2);
    if (searchTokens.length === 0 && norm.normalized) {
      searchTokens.push(norm.normalized);
    }

    const uniqueRegistries = Array.from(new Set(input.allowedRegistries));
    const rawCandidates: { regKey: RegistryKey; row: Record<string, any>; embeddingScore?: number }[] = [];
    const retrievedRows = await retrieveAuthorizedCandidates(input, 50);

    for (const candItem of retrievedRows) {
      const row = candItem.row;
      const regKey = candItem.registry;
          let embeddingScore: number | undefined = undefined;
          if (useEmbeddings && queryNameVec) {
            const candName = row.name || row.student_name || row.farmer_name || row.beneficiary_name || row.applicant_name || row.owner_name || '';
            const candAddr = row.address || row.village || '';
            const candDist = row.district || '';

            const candNameVec = await embedder.generateEmbedding(candName);
            const nameCos = embedder.computeCosineSimilarity(queryNameVec, candNameVec);

            let totalCos = nameCos;
            if (queryAddrVec && (candAddr || candDist)) {
              const candAddrVec = await embedder.generateEmbedding(`${candAddr} ${candDist}`.trim());
              const addrCos = embedder.computeCosineSimilarity(queryAddrVec, candAddrVec);
              totalCos = 0.65 * nameCos + 0.35 * addrCos;
            }

            embeddingScore = Number(totalCos.toFixed(4));
          }

          rawCandidates.push({
            regKey,
            row,
            embeddingScore,
          });
    }

    // 3. Initial Pass Scoring
    let candidateResults: CandidateMatchResult[] = rawCandidates.map(({ regKey, row, embeddingScore }) => {
      const evalResult = evaluateCandidate(input, row, { embeddingScore });
      return {
        candidateId: row.id,
        citizenId: row.citizen_id || undefined,
        registry: regKey,
        matchedFields: evalResult.matchedFields,
        fieldScores: evalResult.fieldScores,
        totalScore: evalResult.totalScore,
        confidenceTier: evalResult.confidenceTier,
        isCollisionWarning: evalResult.isCollisionWarning,
        collisionReason: evalResult.collisionReason,
        corroborationReason: evalResult.corroborationReason,
        explanation: evalResult.explanation,
        rawRecord: row,
      };
    });

    // 4. Cross-Registry Graph Corroboration (Phase 5B)
    if (useGraph && candidateResults.length > 0) {
      const graphCorroborationMap = CrossRegistryGraphCorroborator.corroborateCandidates(candidateResults);

      // Re-evaluate candidates with graph bonuses
      candidateResults = candidateResults.map(cand => {
        const graphResult = graphCorroborationMap.get(cand.candidateId);
        if (graphResult && graphResult.corroborationBonus > 0) {
          const reEval = evaluateCandidate(input, cand.rawRecord, {
            embeddingScore: cand.fieldScores.embeddingScore,
            graphBonus: graphResult.corroborationBonus,
            corroborationReason: graphResult.corroborationReason,
          });

          return {
            ...cand,
            fieldScores: reEval.fieldScores,
            totalScore: reEval.totalScore,
            confidenceTier: reEval.confidenceTier,
            isCollisionWarning: reEval.isCollisionWarning,
            collisionReason: reEval.collisionReason,
            corroborationReason: reEval.corroborationReason,
            explanation: reEval.explanation,
          };
        }
        return cand;
      });
    }

    // 5. Multi-Tier Ranker: Sort by total score, then embedding similarity, then matched fields
    candidateResults.sort((a, b) => {
      // Primary: Total score descending
      if (Math.abs(b.totalScore - a.totalScore) > 0.0001) {
        return b.totalScore - a.totalScore;
      }
      // Tie-breaker 1: Semantic Embedding Score
      const embA = a.fieldScores.embeddingScore ?? 0;
      const embB = b.fieldScores.embeddingScore ?? 0;
      if (Math.abs(embB - embA) > 0.001) {
        return embB - embA;
      }
      // Tie-breaker 2: Number of matched fields
      if (b.matchedFields.length !== a.matchedFields.length) {
        return b.matchedFields.length - a.matchedFields.length;
      }
      // Tie-breaker 3: Name score
      if (Math.abs(b.fieldScores.nameScore - a.fieldScores.nameScore) > 0.001) {
        return b.fieldScores.nameScore - a.fieldScores.nameScore;
      }
      // Tie-breaker 4: Address score
      if (Math.abs(b.fieldScores.addressScore - a.fieldScores.addressScore) > 0.001) {
        return b.fieldScores.addressScore - a.fieldScores.addressScore;
      }
      return 0;
    });

    // 6. Ambiguity Detection: Check if top candidates have nearly identical scores or collision warnings
    let ambiguityDetected = false;
    if (candidateResults.length >= 2) {
      const topScore = candidateResults[0].totalScore;
      if (topScore >= ENTITY_RESOLUTION_THRESHOLDS.MEDIUM_CONFIDENCE) {
        const ambiguousGroup = candidateResults.filter(
          c => Math.abs(topScore - c.totalScore) <= ENTITY_RESOLUTION_THRESHOLDS.AMBIGUITY_SCORE_DELTA
        );
        if (ambiguousGroup.length > 1) {
          ambiguityDetected = true;
          for (const cand of ambiguousGroup) {
            cand.confidenceTier = 'AMBIGUOUS';
          }
        }
      }
    }

    const bestMatch = candidateResults.length > 0 ? candidateResults[0] : undefined;
    if (bestMatch?.isCollisionWarning || bestMatch?.confidenceTier === 'AMBIGUOUS') {
      ambiguityDetected = true;
    }

    return {
      querySummary: {
        name: input.name,
        searchedRegistries: uniqueRegistries,
        totalCandidatesFound: candidateResults.length,
        embeddingModelId: useEmbeddings ? embedder.modelId : undefined,
      },
      candidates: candidateResults,
      bestMatch,
      ambiguityDetected,
      disclaimer:
        'DISCLAIMER: AI Model 2 operates solely as an advisory candidate-matching and recommendation engine. ' +
        'It does NOT make statutory decisions or legally approve identity adjudication without government officer review.',
    };
  }
}
