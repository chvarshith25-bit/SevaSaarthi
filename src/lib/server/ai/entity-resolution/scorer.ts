/**
 * Multi-field scoring, semantic embedding fusion, and collision detection (Phase 5A + Phase 5B)
 */

import {
  EntityResolutionInput,
  FieldSimilarityScores,
  MatchConfidenceTier,
  ENTITY_RESOLUTION_THRESHOLDS,
} from './types';
import {
  computeNameSimilarity,
  computeDobSimilarity,
  computeAddressSimilarity,
  computeDistrictSimilarity,
  computePincodeSimilarity,
} from './similarity';

export interface ScoredCandidateEvaluation {
  fieldScores: FieldSimilarityScores;
  matchedFields: string[];
  totalScore: number;
  confidenceTier: MatchConfidenceTier;
  isCollisionWarning: boolean;
  collisionReason?: string;
  corroborationReason?: string;
  explanation: string;
}

export interface CandidateEvaluationOptions {
  embeddingScore?: number;
  graphBonus?: number;
  corroborationReason?: string;
}

export function evaluateCandidate(
  input: EntityResolutionInput,
  candidateRecord: Record<string, any>,
  options?: CandidateEvaluationOptions
): ScoredCandidateEvaluation {
  // 1. Extract candidate fields according to schema variation
  const candName = candidateRecord.name || candidateRecord.student_name || candidateRecord.farmer_name || candidateRecord.beneficiary_name || candidateRecord.applicant_name || candidateRecord.owner_name || '';
  const candDob = candidateRecord.dob || candidateRecord.date_of_birth || null;
  const candFather = candidateRecord.father_name || candidateRecord.guardian_name || null;
  const candAddress = candidateRecord.address || candidateRecord.village || null;
  const candDistrict = candidateRecord.district || null;
  const candPincode = candidateRecord.pincode || null;

  // 2. Compute individual field similarities
  const nameScore = computeNameSimilarity(input.name, candName);
  const dobScore = (candDob && input.dateOfBirth)
    ? computeDobSimilarity(input.dateOfBirth, candDob)
    : 0.5;
  
  // Father similarity: check input father or guardian
  const queryFather = input.fatherName || input.guardianName || null;
  const fatherScore = (queryFather && candFather)
    ? computeNameSimilarity(queryFather, candFather)
    : 0.5; // neutral if not available in both

  // Address similarity
  const addressScore = (input.address && candAddress)
    ? computeAddressSimilarity(input.address, candAddress)
    : 0.5;

  // District similarity
  const districtScore = (input.district && candDistrict)
    ? computeDistrictSimilarity(input.district, candDistrict)
    : 0.5;

  // Pincode similarity
  const pincodeScore = (input.pincode && candPincode)
    ? computePincodeSimilarity(input.pincode, candPincode)
    : 0.5;

  const embeddingScore = options?.embeddingScore !== undefined ? options.embeddingScore : undefined;
  const graphBonus = options?.graphBonus || 0;

  const fieldScores: FieldSimilarityScores = {
    nameScore,
    dobScore,
    fatherScore,
    addressScore,
    districtScore,
    pincodeScore,
    embeddingScore,
    graphBonus: graphBonus > 0 ? graphBonus : undefined,
  };

  // Only attribute fields that were ACTUALLY present in both records and matched
  const matchedFields: string[] = [];
  if (nameScore >= 0.75 && candName && input.name) matchedFields.push('name');
  if (dobScore >= 0.75 && candDob && input.dateOfBirth) matchedFields.push('dateOfBirth');
  if (fatherScore >= 0.75 && candFather && queryFather) matchedFields.push('fatherName');
  if (addressScore >= 0.70 && candAddress && input.address) matchedFields.push('address');
  if (districtScore >= 0.80 && candDistrict && input.district) matchedFields.push('district');
  if (pincodeScore >= 0.80 && candPincode && input.pincode) matchedFields.push('pincode');
  if (embeddingScore !== undefined && embeddingScore >= 0.80) matchedFields.push('semanticEmbedding');

  // 3. Dynamic Weighted Score Calculation
  let totalWeight = 0;
  let weightedSum = 0;

  // Name is always mandatory
  weightedSum += nameScore * 0.35;
  totalWeight += 0.35;

  // DOB
  if (candDob && input.dateOfBirth) {
    weightedSum += dobScore * 0.25;
    totalWeight += 0.25;
  }

  // Father / Guardian
  if (queryFather && candFather) {
    weightedSum += fatherScore * 0.15;
    totalWeight += 0.15;
  }

  // Address
  if (input.address && candAddress) {
    weightedSum += addressScore * 0.15;
    totalWeight += 0.15;
  }

  // District
  if (input.district && candDistrict) {
    weightedSum += districtScore * 0.05;
    totalWeight += 0.05;
  }

  // Pincode
  if (input.pincode && candPincode) {
    weightedSum += pincodeScore * 0.05;
    totalWeight += 0.05;
  }

  // Semantic Embedding Score (Fine-grained tie breaker & subword variation)
  if (embeddingScore !== undefined) {
    weightedSum += embeddingScore * 0.10;
    totalWeight += 0.10;
  }

  let baseScore = totalWeight > 0 ? (weightedSum / totalWeight) : nameScore;

  // 4. Name Collision Detection (Homonym Check)
  // Condition: High name similarity (>= 0.85) BUT conflicting DOB, Father, or Geographic Attributes
  let isCollisionWarning = false;
  let collisionReason: string | undefined = undefined;

  const isDobConflict = Boolean(
    candDob && input.dateOfBirth && dobScore <= ENTITY_RESOLUTION_THRESHOLDS.COLLISION_DOB_CONFLICT_THRESHOLD
  );
  const isFatherConflict = Boolean(
    input.fatherName && candFather && fatherScore < ENTITY_RESOLUTION_THRESHOLDS.COLLISION_FATHER_CONFLICT_THRESHOLD
  );
  const isDistrictConflict = Boolean(
    input.district && candDistrict && districtScore < ENTITY_RESOLUTION_THRESHOLDS.COLLISION_DISTRICT_CONFLICT_THRESHOLD
  );
  const isPincodeConflict = Boolean(
    input.pincode && candPincode && pincodeScore === 0.0
  );
  const isAddressMismatch = Boolean(
    input.address && candAddress && addressScore < ENTITY_RESOLUTION_THRESHOLDS.COLLISION_ADDRESS_CONFLICT_THRESHOLD
  );

  const isGeographicConflict = (isDistrictConflict && isAddressMismatch) || (isPincodeConflict && isAddressMismatch);

  if (
    nameScore >= ENTITY_RESOLUTION_THRESHOLDS.COLLISION_NAME_THRESHOLD &&
    (isDobConflict || isFatherConflict || isGeographicConflict)
  ) {
    isCollisionWarning = true;
    const conflicts: string[] = [];
    if (isDobConflict) conflicts.push(`Date of Birth (${input.dateOfBirth} vs ${candDob})`);
    if (isFatherConflict) conflicts.push(`Father/Guardian (${queryFather} vs ${candFather})`);
    if (isGeographicConflict) {
      if (isDistrictConflict) conflicts.push(`District/Address (${input.district} vs ${candDistrict})`);
      else if (isPincodeConflict) conflicts.push(`Pincode/Address (${input.pincode} vs ${candPincode})`);
    }
    collisionReason = `Homonym Collision: Identical or near-identical name, but conflicting ${conflicts.join(' and ')}.`;
  }

  // Apply cross-registry graph bonus if no collision
  let finalScore = baseScore;
  if (!isCollisionWarning && graphBonus > 0) {
    finalScore = Math.min(1.0, baseScore + graphBonus);
  }
  const totalScore = Number(finalScore.toFixed(4));

  // 5. Threshold Classification
  let confidenceTier: MatchConfidenceTier = 'LOW';

  if (isCollisionWarning) {
    confidenceTier = 'AMBIGUOUS';
  } else if (totalScore >= ENTITY_RESOLUTION_THRESHOLDS.HIGH_CONFIDENCE && nameScore >= 0.80) {
    confidenceTier = 'HIGH';
  } else if (totalScore >= ENTITY_RESOLUTION_THRESHOLDS.MEDIUM_CONFIDENCE && nameScore >= 0.70) {
    confidenceTier = 'MEDIUM';
  } else {
    confidenceTier = 'LOW';
  }

  // 6. Explanation Synthesis
  let explanation = '';
  if (isCollisionWarning) {
    explanation = 'WARNING: Potential name collision detected. ' + (collisionReason || '') + ' Mandatory manual officer adjudication required.';
  } else if (confidenceTier === 'HIGH') {
    const fieldsDesc = matchedFields.length > 0 ? 'across ' + matchedFields.join(', ') : '';
    explanation = 'Strong multi-attribute match ' + fieldsDesc + ' with total similarity score ' + totalScore + '.';
    if (options?.corroborationReason) {
      explanation += ' ' + options.corroborationReason;
    }
  } else if (confidenceTier === 'MEDIUM') {
    const fieldsDesc = matchedFields.length > 0 ? ' Matched on: ' + matchedFields.join(', ') + '.' : '';
    explanation = 'Moderate match with total score ' + totalScore + '.' + fieldsDesc;
    if (options?.corroborationReason) {
      explanation += ' ' + options.corroborationReason;
    }
  } else {
    explanation = 'Weak match with total score ' + totalScore + '. Insufficient attribute corroboration.';
  }

  return {
    fieldScores,
    matchedFields,
    totalScore,
    confidenceTier,
    isCollisionWarning,
    collisionReason,
    corroborationReason: options?.corroborationReason,
    explanation,
  };
}
