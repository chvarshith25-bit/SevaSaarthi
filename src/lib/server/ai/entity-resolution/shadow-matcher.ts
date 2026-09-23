/**
 * AI Model 2 V2.1 Shadow Execution & Telemetry Engine (Phase 7E.2)
 *
 * Runs Model 2 V1 (Authoritative Deterministic Engine) in parallel with
 * Model 2 V2.1 (Calibrated Supervised Engine in Shadow Mode).
 *
 * Guarantees:
 * - V1 remains 100% authoritative for all production workflows.
 * - V2.1 produces ZERO statutory state mutations or side effects.
 * - All queries are gated by DPDP statutory consent validation.
 * - Telemetry is strictly anonymized with zero raw PII.
 */

import {
  EntityResolutionInput,
  EntityResolutionResponse,
  CandidateMatchResult,
} from './types';
import { EntityResolutionEngine } from './engine';
import { EntityResolutionEngineV3 } from './v3-engine';
import { pgQuery } from '../../pg-db';

export type DisagreementCategory =
  | 'A. V3.1 clearly better'
  | 'B. V1 clearly better'
  | 'C. Both plausible'
  | 'D. V3.1 should defer to manual review'
  | 'E. V1 should defer to manual review'
  | 'F. Cross-registry equivalent'
  | 'NONE';

export interface Model2ShadowComparison {
  requestId: string;
  authoritativeV1: EntityResolutionResponse;
  shadowV3: EntityResolutionResponse | null;
  agreement: boolean;
  isSameMasterCitizen: boolean;
  disagreementCategory: DisagreementCategory;
  v1TopCandidateId: string | null;
  v1Confidence: number | null;
  v1Tier: string | null;
  v3TopCandidateId: string | null;
  v3Probability: number | null;
  v3Tier: string | null;
  isAmbiguous: boolean;
  collisionWarning: boolean;
  fallbackUsed: boolean;
  v1LatencyMs: number;
  v3LatencyMs: number;
}

export class EntityResolutionShadowMatcher {
  /**
   * Primary entry point: Execute V1 authoritatively, V3.1 in shadow mode,
   * record telemetry, and return V1 result with zero side effects.
   */
  public static async matchAndLogShadow(
    input: EntityResolutionInput,
    requestId: string
  ): Promise<EntityResolutionResponse> {
    // 1. DPDP Statutory Consent Verification Gate (Upstream Pre-Condition)
    if (!input.consentVerified) {
      throw new Error(
        'DPDP Statutory Consent Violation: Entity resolution query aborted because consentVerified is false.'
      );
    }

    // 2. Authorized Registry Filtering
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

    // 3. Execute Model 2 V1 (Authoritative)
    const v1Start = performance.now();
    const v1Res = await EntityResolutionEngine.matchEntity(input);
    const v1LatencyMs = Number((performance.now() - v1Start).toFixed(2));

    // 4. Execute Model 2 V3.1 (Shadow Mode - Isolated within Try/Catch)
    let v3Res: EntityResolutionResponse | null = null;
    let fallbackUsed = false;
    let v3LatencyMs = 0.0;

    try {
      const v3Start = performance.now();
      v3Res = await EntityResolutionEngineV3.matchEntityV3(input);
      v3LatencyMs = Number((performance.now() - v3Start).toFixed(2));
    } catch (err) {
      console.warn('[EntityResolutionShadowMatcher] V3.1 shadow execution error (V1 fallback active):', err);
      fallbackUsed = true;
      v3Res = null;
    }

    // 5. Compare & Categorize
    const comparison = this.compareResolutions(requestId, v1Res, v3Res, fallbackUsed, v1LatencyMs, v3LatencyMs);

    // 6. Log Shadow Telemetry (Asynchronous / Non-blocking to workflow)
    await this.logShadowTelemetry(comparison).catch((logErr) => {
      console.error('[EntityResolutionShadowMatcher] Failed to write shadow telemetry:', logErr);
    });

    // 7. Return Authoritative V1 Response
    return v1Res;
  }

  /**
   * Compare V1 and V3.1 resolution outputs and classify agreement / disagreement.
   */
  public static compareResolutions(
    requestId: string,
    v1Res: EntityResolutionResponse,
    v3Res: EntityResolutionResponse | null,
    fallbackUsed: boolean,
    v1LatencyMs: number,
    v3LatencyMs: number,
    isSameCitizen: boolean = false
  ): Model2ShadowComparison {
    const v1Top = v1Res.bestMatch;
    const v3Top = v3Res?.bestMatch;

    const v1TopId = v1Top?.candidateId || null;
    const v3TopId = v3Top?.candidateId || null;

    const v1Confidence = v1Top ? v1Top.totalScore : null;
    const v1Tier = v1Top ? v1Top.confidenceTier : null;

    const v3Probability = v3Top ? v3Top.totalScore : null;
    const v3Tier = v3Top ? v3Top.confidenceTier : null;

    const isAmbiguous = Boolean(v1Res.ambiguityDetected || v3Res?.ambiguityDetected);
    const collisionWarning = Boolean(
      v1Res.candidates.some((c) => c.isCollisionWarning) ||
      (v3Res && v3Res.candidates.some((c) => c.isCollisionWarning))
    );

    // Agreement condition: Both identify identical top candidate or both identify no candidates
    let agreement = (v1TopId === v3TopId);
    if (!v1TopId && !v3TopId) agreement = true;

    // Categorize Disagreement
    let disagreementCategory: DisagreementCategory = 'NONE';
    if (!agreement) {
      if (isSameCitizen) {
        disagreementCategory = 'F. Cross-registry equivalent';
      } else if (collisionWarning || v3Tier === 'AMBIGUOUS' || (v3Top && v3Top.isCollisionWarning)) {
        disagreementCategory = 'D. V3.1 should defer to manual review';
      } else if (v3Top && (!v1Top || (v3Top.totalScore >= 0.70 && v1Top.totalScore < 0.60))) {
        disagreementCategory = 'A. V3.1 clearly better';
      } else if (v1Top && (!v3Top || (v1Top.totalScore >= 0.85 && v3Top.totalScore < 0.40))) {
        disagreementCategory = 'B. V1 clearly better';
      } else if (v1Res.ambiguityDetected && !v3Res?.ambiguityDetected && v1Top && v3Top) {
        disagreementCategory = 'E. V1 should defer to manual review';
      } else {
        disagreementCategory = 'C. Both plausible';
      }
    }

    return {
      requestId,
      authoritativeV1: v1Res,
      shadowV3: v3Res,
      agreement,
      isSameMasterCitizen: isSameCitizen || agreement,
      disagreementCategory,
      v1TopCandidateId: v1TopId,
      v1Confidence,
      v1Tier,
      v3TopCandidateId: v3TopId,
      v3Probability,
      v3Tier,
      isAmbiguous,
      collisionWarning,
      fallbackUsed,
      v1LatencyMs,
      v3LatencyMs,
    };
  }

  /**
   * Persist telemetry metadata to model2_shadow_log.
   */
  public static async logShadowTelemetry(comp: Model2ShadowComparison): Promise<void> {
    await pgQuery(
      `INSERT INTO model2_shadow_log (
        request_id,
        v1_model_version,
        v2_model_version,
        v1_top_candidate_id,
        v1_confidence,
        v1_tier,
        v2_top_candidate_id,
        v2_probability,
        v2_tier,
        is_ambiguous,
        collision_warning,
        agreement,
        disagreement_category,
        fallback_used,
        v1_latency_ms,
        v2_latency_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        comp.requestId,
        'v1.0.0-deterministic',
        'v3.1.0-calibrated',
        comp.v1TopCandidateId,
        comp.v1Confidence,
        comp.v1Tier,
        comp.v3TopCandidateId,
        comp.v3Probability,
        comp.v3Tier,
        comp.isAmbiguous,
        comp.collisionWarning,
        comp.agreement,
        comp.disagreementCategory,
        comp.fallbackUsed,
        comp.v1LatencyMs,
        comp.v3LatencyMs,
      ]
    );
  }
}
