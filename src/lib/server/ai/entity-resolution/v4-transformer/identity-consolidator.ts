/**
 * Seva Saarthi AI Model 2 V4 - Identity-Level Consolidator
 * 
 * Preserves Phase 7E.6.1 Architecture:
 * - Unifies candidate records across authorized registries by master_citizen_id.
 * - Ranks unique person identities, eliminating artificial self-ties.
 * - Aggregates cross-registry supporting evidence and maximum field similarities.
 * - Propagates collision warnings across all records of an identity cluster:
 *   If ANY record has a demographic contradiction, the ENTIRE identity is demoted to AMBIGUOUS (score <= 0.25).
 * - Sparse records cannot bypass contradictions found in complete records.
 */

import { EntityResolutionInput } from '../types';
import { V4CandidateMatchResult, Model2V4Weights, V4FieldSimilarityScores } from './types';
import { V4CollisionGuard } from './collision-guard';

export class V4IdentityConsolidator {
  /**
   * Consolidates raw candidate records into unique citizen identities.
   */
  public static consolidate(
    input: EntityResolutionInput,
    rawCandidates: V4CandidateMatchResult[],
    thresholds: Model2V4Weights['thresholds']
  ): { consolidatedCandidates: V4CandidateMatchResult[]; ambiguityDetected: boolean } {
    if (rawCandidates.length === 0) {
      return { consolidatedCandidates: [], ambiguityDetected: false };
    }

    // 1. Group candidate records by master citizen identity
    const identityClusters = new Map<string, V4CandidateMatchResult[]>();
    for (const cand of rawCandidates) {
      const clusterKey =
        cand.citizenId ||
        cand.rawRecord?.citizen_id ||
        cand.rawRecord?.master_citizen_id ||
        cand.candidateId;
      if (!identityClusters.has(clusterKey)) {
        identityClusters.set(clusterKey, []);
      }
      identityClusters.get(clusterKey)!.push(cand);
    }

    const consolidatedList: V4CandidateMatchResult[] = [];

    // 2. Process and consolidate each identity cluster
    for (const [citizenId, records] of identityClusters.entries()) {
      // Check if ANY record in the identity cluster has a collision warning or demographic contradiction
      const collidingRecord = records.find(
        (r) => r.isCollisionWarning || r.confidenceTier === 'AMBIGUOUS'
      );

      const allSupportingRegistries = Array.from(new Set(records.map((r) => r.registry)));
      const allSupportingRecordIds = records.map((r) => r.candidateId);
      const allMatchedFields = Array.from(new Set(records.flatMap((r) => r.matchedFields)));

      // Aggregate best field scores across all records of this identity
      const aggregatedFieldScores: V4FieldSimilarityScores = {
        nameScore: Math.max(...records.map((r) => r.fieldScores.nameScore || 0.0)),
        dobScore: Math.max(...records.map((r) => r.fieldScores.dobScore || 0.0)),
        fatherScore: Math.max(...records.map((r) => r.fieldScores.fatherScore || 0.0)),
        addressScore: Math.max(...records.map((r) => r.fieldScores.addressScore || 0.0)),
        districtScore: Math.max(...records.map((r) => r.fieldScores.districtScore || 0.0)),
        pincodeScore: Math.max(...records.map((r) => r.fieldScores.pincodeScore || 0.0)),
        embeddingScore: Math.max(...records.map((r) => r.fieldScores.embeddingScore || 0.0)),
        graphBonus: Math.max(...records.map((r) => r.fieldScores.graphBonus || 0.0)),
        transformerScore: Math.max(...records.map((r) => r.fieldScores.transformerScore || 0.0)),
        structuredScore: Math.max(...records.map((r) => r.fieldScores.structuredScore || 0.0)),
      };

      if (collidingRecord) {
        // HARD SAFETY RULE: Contradiction in ANY authorized record demotes the ENTIRE identity
        // A sparse record with missing fields CANNOT erase or bypass this contradiction!
        const representative = collidingRecord || records[0];
        const minScore = Math.min(
          ...records.map((r) => r.totalScore),
          thresholds.HARD_CONFLICT_CAP
        );

        consolidatedList.push({
          candidateId: representative.candidateId,
          citizenId: citizenId.startsWith('CIT-') ? citizenId : representative.citizenId,
          registry: representative.registry,
          matchedFields: allMatchedFields,
          fieldScores: aggregatedFieldScores,
          structuredScore: representative.structuredScore,
          transformerScore: representative.transformerScore,
          hybridScore: Number(Math.min(minScore, thresholds.HARD_CONFLICT_CAP).toFixed(4)),
          calibratedProbability: Number(Math.min(minScore, thresholds.HARD_CONFLICT_CAP).toFixed(4)),
          totalScore: Number(Math.min(minScore, thresholds.HARD_CONFLICT_CAP).toFixed(4)),
          confidenceTier: 'AMBIGUOUS',
          isCollisionWarning: true,
          collisionReason:
            representative.collisionReason ||
            'High name similarity with conflicting demographic fields in authorized registry.',
          supportingRegistries: allSupportingRegistries,
          supportingRecordIds: allSupportingRecordIds,
          identityRecordCount: records.length,
          explanation: `Model 2 V4 Hybrid Collision Guard: Identity ${citizenId} has conflicting demographic vectors in ${representative.registry}. Demoted to AMBIGUOUS for mandatory officer review.`,
          gatingDecision: representative.gatingDecision,
          rawRecord: representative.rawRecord,
        });
      } else {
        // Clean identity: Sort records by totalScore and completeness
        records.sort((a, b) => {
          if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
          return b.matchedFields.length - a.matchedFields.length;
        });

        const primaryRecord = records[0];

        consolidatedList.push({
          candidateId: primaryRecord.candidateId,
          citizenId: citizenId.startsWith('CIT-') ? citizenId : primaryRecord.citizenId,
          registry: primaryRecord.registry,
          matchedFields: allMatchedFields,
          fieldScores: aggregatedFieldScores,
          structuredScore: primaryRecord.structuredScore,
          transformerScore: primaryRecord.transformerScore,
          hybridScore: primaryRecord.hybridScore,
          calibratedProbability: primaryRecord.calibratedProbability,
          totalScore: primaryRecord.totalScore,
          confidenceTier: primaryRecord.confidenceTier,
          isCollisionWarning: false,
          corroborationReason:
            primaryRecord.corroborationReason ||
            (allSupportingRegistries.length > 1
              ? `Corroborated across ${allSupportingRegistries.length} registries: ${allSupportingRegistries.join(', ')}`
              : undefined),
          supportingRegistries: allSupportingRegistries,
          supportingRecordIds: allSupportingRecordIds,
          identityRecordCount: records.length,
          explanation: primaryRecord.explanation,
          gatingDecision: primaryRecord.gatingDecision,
          rawRecord: primaryRecord.rawRecord,
        });
      }
    }

    // 3. Person-Level Ranking:
    // Primary: Higher totalScore ranks first
    // Secondary: Higher supporting registry count breaks ties
    // Tertiary: Stable deterministic tie-breaker
    consolidatedList.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      const bRegs = b.supportingRegistries?.length || 1;
      const aRegs = a.supportingRegistries?.length || 1;
      if (bRegs !== aRegs) return bRegs - aRegs;

      return (a.citizenId || a.candidateId).localeCompare(b.citizenId || b.candidateId);
    });

    // 4. Ambiguity Detection between DIFFERENT Person Identities
    let ambiguityDetected = false;
    if (consolidatedList.length >= 2) {
      const top1 = consolidatedList[0];
      const top2 = consolidatedList[1];
      if (top1.confidenceTier === 'AMBIGUOUS' || top1.isCollisionWarning) {
        ambiguityDetected = true;
      } else if (
        top1.totalScore >= thresholds.MEDIUM_CONFIDENCE &&
        top2.totalScore >= thresholds.MEDIUM_CONFIDENCE &&
        top1.totalScore - top2.totalScore < thresholds.AMBIGUITY_SCORE_DELTA
      ) {
        ambiguityDetected = true;
        top1.confidenceTier = 'AMBIGUOUS';
        top1.explanation = `Model 2 V4 Ambiguity Gate: Close match tie detected with another person candidate (score delta ${(top1.totalScore - top2.totalScore).toFixed(4)} < ${thresholds.AMBIGUITY_SCORE_DELTA}). Mandatory officer review required.`;
      }
    } else if (
      consolidatedList.length === 1 &&
      (consolidatedList[0].confidenceTier === 'AMBIGUOUS' || consolidatedList[0].isCollisionWarning)
    ) {
      ambiguityDetected = true;
    }

    return { consolidatedCandidates: consolidatedList, ambiguityDetected };
  }
}
