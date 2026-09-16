/**
 * Seva Saarthi AI Model 2 V4 - Collision Safety Guardrail
 * 
 * Enforces hard demographic collision safety constraints:
 * - High Transformer semantic similarity (even 0.99) MUST NEVER override demographic contradictions.
 * - Caps scores at HARD_CONFLICT_CAP (<= 0.25) when conflicts are detected.
 * - Forces confidence tier to 'AMBIGUOUS' for mandatory government officer review.
 * - Prevents homonym false matches and cross-registry identity collisions.
 */

import { EntityResolutionInput, RegistryKey, ENTITY_RESOLUTION_THRESHOLDS } from '../types';
import { V4FieldSimilarityScores } from './types';

export interface CollisionEvaluationResult {
  isCollision: boolean;
  collisionReason?: string;
  hasDobConflict: boolean;
  hasFatherConflict: boolean;
  hasDistrictConflict: boolean;
  hasAddressConflict: boolean;
}

export class V4CollisionGuard {
  public static readonly HARD_CONFLICT_CAP = 0.25;

  /**
   * Evaluates whether a candidate record presents a demographic collision with the query.
   */
  public static evaluateCollision(
    input: EntityResolutionInput,
    row: Record<string, any>,
    fieldScores: V4FieldSimilarityScores
  ): CollisionEvaluationResult {
    let isCollision = false;
    const reasons: string[] = [];

    let hasDobConflict = false;
    let hasFatherConflict = false;
    let hasDistrictConflict = false;
    let hasAddressConflict = false;

    // 1. High Name Similarity is a prerequisite for a homonym collision check
    const highNameSimilarity = fieldScores.nameScore >= 0.60;

    // 2. Date of Birth Contradiction Check
    const rowDob = row.dob || row.date_of_birth || row.birth_date;
    if (input.dateOfBirth && rowDob) {
      if (fieldScores.dobScore < 0.60) {
        hasDobConflict = true;
        isCollision = true;
        reasons.push(`DOB contradiction (Query: ${input.dateOfBirth} vs Registry: ${rowDob})`);
      }
    }

    // 3. Father / Guardian Name Contradiction Check
    const rowFather = row.father_name || row.guardian_name || row.father;
    if (input.fatherName && rowFather) {
      if (fieldScores.fatherScore < 0.60) {
        hasFatherConflict = true;
        // If name matches strongly but father is completely different, flag collision
        if (highNameSimilarity) {
          isCollision = true;
          reasons.push(`Father name conflict (Query: ${input.fatherName} vs Registry: ${rowFather})`);
        }
      }
    }

    // 4. District Contradiction Check
    const rowDistrict = row.district;
    if (input.district && rowDistrict) {
      if (fieldScores.districtScore < 0.75) {
        hasDistrictConflict = true;
        if (highNameSimilarity) {
          isCollision = true;
          reasons.push(`District contradiction (Query: ${input.district} vs Registry: ${rowDistrict})`);
        }
      }
    }

    // 5. Complete Address Contradiction Check (when both full addresses exist)
    const rowAddress = row.address || row.village;
    if (input.address && rowAddress && highNameSimilarity) {
      if (fieldScores.addressScore < 0.20 && hasDistrictConflict) {
        hasAddressConflict = true;
        isCollision = true;
        reasons.push(`Full address contradiction (Query: ${input.address} vs Registry: ${rowAddress})`);
      }
    }

    return {
      isCollision,
      collisionReason: reasons.length > 0 ? reasons.join('; ') : undefined,
      hasDobConflict,
      hasFatherConflict,
      hasDistrictConflict,
      hasAddressConflict,
    };
  }
}
