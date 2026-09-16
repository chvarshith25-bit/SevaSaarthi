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
    const highNameSimilarity =
      fieldScores.nameScore >= 0.60 ||
      (fieldScores.nameSemanticScore !== undefined && fieldScores.nameSemanticScore >= 0.70) ||
      (fieldScores.transformerScore !== undefined && fieldScores.transformerScore >= 0.70);

    // 2. Date of Birth Contradiction Check (Strictly structured)
    const rowDob = row.dob || row.date_of_birth || row.birth_date;
    if (input.dateOfBirth && rowDob) {
      if (fieldScores.dobScore < 0.60) {
        hasDobConflict = true;
        isCollision = true;
        reasons.push(`DOB contradiction (Query: ${input.dateOfBirth} vs Registry: ${rowDob})`);
      }
    }

    // 3. Father / Guardian Name Contradiction Check (Strictly structured)
    const rowFather = row.father_name || row.guardian_name || row.father;
    const queryFather = input.fatherName || input.guardianName;
    if (queryFather && rowFather) {
      if (fieldScores.fatherScore < 0.60) {
        hasFatherConflict = true;
        if (highNameSimilarity) {
          isCollision = true;
          reasons.push(`Father name conflict (Query: ${queryFather} vs Registry: ${rowFather})`);
        }
      }
    }

    // 4. District Contradiction Check (Strictly structured)
    const rowDistrict = row.district;
    if (input.district && rowDistrict) {
      if (fieldScores.districtScore < 0.60) {
        hasDistrictConflict = true;
        if (highNameSimilarity) {
          isCollision = true;
          reasons.push(`District contradiction (Query: ${input.district} vs Registry: ${rowDistrict})`);
        }
      }
    }

    // 5. Pincode Contradiction Check (Strictly structured)
    const rowPincode = row.pincode || row.pin_code;
    if (input.pincode && rowPincode) {
      if (fieldScores.pincodeScore < 0.60) {
        if (highNameSimilarity) {
          isCollision = true;
          reasons.push(`Pincode contradiction (Query: ${input.pincode} vs Registry: ${rowPincode})`);
        }
      }
    }

    // 6. Complete Address Contradiction Check
    const rowAddress = row.address || row.village;
    if (input.address && rowAddress && highNameSimilarity) {
      if (fieldScores.addressScore < 0.15) {
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
