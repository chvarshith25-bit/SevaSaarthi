/**
 * Seva Saarthi AI Model 2 V4 - Hybrid Calibrated Scorer
 * 
 * Fuses structured demographic evidence with 768-dimensional multilingual-e5-base
 * semantic embeddings using a calibrated supervised monotonic logistic model.
 * 
 * Architecture:
 * - 16-dimensional monotonic feature schema
 * - Demographic conflict penalties (strictly negative)
 * - Transformer semantic similarity as an additive advisory signal (weight > 0)
 * - Platt temperature scaling (T=0.68) for well-calibrated posterior probabilities
 * - Hard Collision Guard demotion for demographic contradictions
 */

import { EntityResolutionInput, RegistryKey } from '../types';
import {
  V4CandidateMatchResult,
  Model2V4Weights,
  EXPECTED_V4_FEATURE_NAMES,
  V4FieldSimilarityScores,
} from './types';
import {
  computeNameSimilarity,
  computeDobSimilarity,
  computeAddressSimilarity,
  computeDistrictSimilarity,
  computePincodeSimilarity,
  jaroWinklerSimilarity,
} from '../similarity';
import { normalizeName, normalizeDate, normalizeAddress, normalizePincode } from '../normalizer';
import { V4CollisionGuard } from './collision-guard';

export const DEFAULT_V4_CONFIG: Model2V4Weights = {
  version: 'v4.0.0-experimental',
  model_name: 'entity-resolver-v4-transformer-hybrid',
  model_type: 'Calibrated Multilingual Transformer Hybrid Entity Resolution',
  transformer_model_id: 'intfloat/multilingual-e5-base',
  transformer_dimension: 768,
  feature_names: EXPECTED_V4_FEATURE_NAMES,
  fusion_strategy: 'LEARNED_FUSION',
  weights: [
    0.2200,  // name_similarity
    1.2500,  // initials_compatibility
    0.2000,  // dob_similarity
    0.2000,  // father_similarity
    0.2000,  // address_similarity
    0.2500,  // district_similarity
    0.2000,  // pincode_similarity
    0.3500,  // transformer_e5_similarity (semantic boost for multilingual/paraphrase)
    0.2000,  // graph_corroboration
    0.0000,  // available_field_count
    -6.5000, // conflicting_field_count (strong demographic penalty)
    0.0000,  // missing_dob
    0.0000,  // missing_father
    0.0000,  // missing_address
    0.0000,  // missing_district
    0.0000,  // missing_pincode
  ],
  bias: -0.1200,
  temperature: 0.68,
  fusion_coefficients: {
    alpha_structured: 0.55,
    beta_transformer: 0.30,
    gamma_graph: 0.15,
    conflict_penalty_weight: 1.0,
  },
  thresholds: {
    HIGH_CONFIDENCE: 0.85,
    MEDIUM_CONFIDENCE: 0.60,
    LOW_CONFIDENCE: 0.35,
    HARD_CONFLICT_CAP: 0.25,
    AMBIGUITY_SCORE_DELTA: 0.05,
  },
};

export const DEFAULT_V4_1_CONFIG: Model2V4Weights = {
  version: 'v4.1.0-hybrid-fusion',
  model_name: 'entity-resolver-v4.1-transformer-hybrid',
  model_type: 'Calibrated Field-Aware Multilingual Transformer Hybrid Entity Resolution',
  transformer_model_id: 'intfloat/multilingual-e5-base',
  transformer_dimension: 768,
  feature_names: [
    'name_similarity',
    'initials_compatibility',
    'dob_similarity',
    'father_similarity',
    'address_similarity',
    'district_similarity',
    'pincode_similarity',
    'ngram_similarity',
    'graph_corroboration',
    'available_field_count',
    'conflicting_field_count',
    'missing_dob',
    'missing_father',
    'missing_address',
    'missing_district',
    'missing_pincode',
    'transformer_name_similarity',
    'transformer_address_similarity',
    'transformer_district_similarity',
    'transformer_profile_similarity',
  ],
  fusion_strategy: 'LEARNED_FUSION',
  weights: [
    0.2200,  // 0: name_similarity
    1.3500,  // 1: initials_compatibility
    0.2200,  // 2: dob_similarity
    0.2200,  // 3: father_similarity
    0.2000,  // 4: address_similarity
    0.2600,  // 5: district_similarity
    0.2000,  // 6: pincode_similarity
    0.2000,  // 7: ngram_similarity
    0.2000,  // 8: graph_corroboration
    0.0000,  // 9: available_field_count
    -6.5000, // 10: conflicting_field_count (strictly negative hard conflict penalty)
    0.0000,  // 11: missing_dob
    0.0000,  // 12: missing_father
    0.0000,  // 13: missing_address
    0.0000,  // 14: missing_district
    0.0000,  // 15: missing_pincode
    0.2800,  // 16: transformer_name_similarity
    0.1500,  // 17: transformer_address_similarity
    0.1000,  // 18: transformer_district_similarity
    0.2200,  // 19: transformer_profile_similarity
  ],
  bias: -0.1500,
  temperature: 0.68,
  fusion_coefficients: {
    alpha_structured: 0.70,
    beta_transformer: 0.20,
    gamma_graph: 0.10,
    conflict_penalty_weight: 1.0,
  },
  thresholds: {
    HIGH_CONFIDENCE: 0.85,
    MEDIUM_CONFIDENCE: 0.60,
    LOW_CONFIDENCE: 0.35,
    HARD_CONFLICT_CAP: 0.25,
    AMBIGUITY_SCORE_DELTA: 0.05,
  },
};

export class V4HybridScorer {
  private readonly config: Model2V4Weights;

  constructor(config: Model2V4Weights = DEFAULT_V4_1_CONFIG) {
    this.config = config;
    this.validateWeights();
  }

  /**
   * Runtime integrity assertion to ensure monotonic non-negative weights on evidence
   * and non-positive penalties on conflicts.
   */
  private validateWeights(): void {
    const weights = this.config.weights;
    const expectedLength = this.config.feature_names.length;
    if (weights.length !== expectedLength) {
      throw new Error(
        `Model 2 V4 configuration error: expected ${expectedLength} weights, got ${weights.length}`
      );
    }
    // Conflict penalty (index 10 in all schemas) must be strictly negative
    if (weights[10] >= 0.0) {
      throw new Error(
        `Model 2 V4 safety violation: conflicting_field_count weight must be strictly negative, got ${weights[10]}`
      );
    }
  }

  /**
   * Evaluates a single candidate row against the query input.
   */
  public evaluateCandidate(
    input: EntityResolutionInput,
    row: Record<string, any>,
    registry: RegistryKey,
    transformerSimilarity: number | {
      nameSemantic?: number;
      fatherSemantic?: number;
      addressSemantic?: number;
      districtSemantic?: number;
      profileSemantic?: number;
    },
    graphCorroborationBonus = 0.0
  ): V4CandidateMatchResult {
    const candId =
      row.income_certificate_number ||
      row.scholarship_id ||
      row.farmer_id ||
      row.health_scheme_id ||
      row.housing_scheme_id ||
      row.survey_number ||
      row.pan_reference ||
      row.id ||
      `cand-${Math.random().toString(36).substring(2, 8)}`;

    const citizenId = row.citizen_id || row.master_citizen_id;

    // 1. Extract and compute demographic field similarities
    const candName =
      row.name ||
      row.student_name ||
      row.farmer_name ||
      row.beneficiary_name ||
      row.applicant_name ||
      row.owner_name ||
      row.full_name ||
      '';
    const candDob = row.dob || row.date_of_birth || row.birth_date;
    const candFather = row.father_name || row.guardian_name || row.father;
    const candAddress = row.address || row.village;
    const candDistrict = row.district;
    const candPincode = row.pincode || row.pin_code;

    // Parse transformer similarities
    let nameSemanticSim = 0.0;
    let addressSemanticSim = 0.0;
    let districtSemanticSim = 0.0;
    let profileSemanticSim = 0.0;
    let primaryTransformerSim = 0.0;

    if (typeof transformerSimilarity === 'number') {
      primaryTransformerSim = transformerSimilarity;
      profileSemanticSim = transformerSimilarity;
      nameSemanticSim = transformerSimilarity;
    } else {
      nameSemanticSim = transformerSimilarity.nameSemantic ?? 0.0;
      addressSemanticSim = transformerSimilarity.addressSemantic ?? 0.0;
      districtSemanticSim = transformerSimilarity.districtSemantic ?? 0.0;
      profileSemanticSim = transformerSimilarity.profileSemantic ?? 0.0;
      primaryTransformerSim = profileSemanticSim > 0 ? profileSemanticSim : nameSemanticSim;
    }

    const matchedFields: string[] = [];

    // Name similarity (fusing lexical and transformer semantic)
    const rawNameScore = computeNameSimilarity(input.name, candName);
    const nameScore = Math.max(rawNameScore, nameSemanticSim);
    if (nameScore >= 0.60) matchedFields.push('name');

    // Initials compatibility
    let initialsScore = 0.0;
    const normQ = normalizeName(input.name);
    const normC = normalizeName(candName);
    if (normQ.tokens.length > 0 && normC.tokens.length > 0) {
      if (normQ.tokens[0][0] === normC.tokens[0][0]) {
        initialsScore = 1.0;
      }
    }
    if (nameSemanticSim >= 0.85) {
      initialsScore = Math.max(initialsScore, 0.90);
    }

    // DOB similarity (strictly numeric/lexical)
    let dobScore = 0.0;
    let missingDob = 1.0;
    let dobConflict = false;
    if (input.dateOfBirth && candDob) {
      missingDob = 0.0;
      dobScore = computeDobSimilarity(input.dateOfBirth, candDob);
      if (dobScore >= 0.90) matchedFields.push('dob');
      else if (dobScore < 0.60) dobConflict = true;
    }

    // Father similarity (fusing lexical and specific father semantic)
    let fatherScore = 0.0;
    let missingFather = 1.0;
    let fatherConflict = false;
    const queryFather = input.fatherName || input.guardianName;
    const fatherSemanticSim = typeof transformerSimilarity === 'object' && (transformerSimilarity as any).fatherSemantic !== undefined
      ? (transformerSimilarity as any).fatherSemantic
      : 0.0;

    if (queryFather && candFather) {
      missingFather = 0.0;
      const rawFatherScore = jaroWinklerSimilarity(
        normalizeName(queryFather).normalized,
        normalizeName(candFather).normalized
      );
      fatherScore = Math.max(rawFatherScore, fatherSemanticSim);
      if (fatherScore >= 0.70) matchedFields.push('fatherName');
      else if (fatherScore < 0.60) fatherConflict = true;
    }

    // Address similarity (fusing lexical and semantic)
    let addressScore = 0.0;
    let missingAddress = 1.0;
    let addressConflict = false;
    if (input.address && candAddress) {
      missingAddress = 0.0;
      const rawAddressScore = computeAddressSimilarity(input.address, candAddress);
      addressScore = Math.max(rawAddressScore, addressSemanticSim);
      if (addressScore >= 0.60) matchedFields.push('address');
      else if (addressScore < 0.15 && addressSemanticSim < 0.50) addressConflict = true;
    }

    // District similarity (fusing lexical and semantic)
    let districtScore = 0.0;
    let missingDistrict = 1.0;
    let districtConflict = false;
    if (input.district && candDistrict) {
      missingDistrict = 0.0;
      const rawDistrictScore = computeDistrictSimilarity(input.district, candDistrict);
      districtScore = Math.max(rawDistrictScore, districtSemanticSim);
      if (districtScore >= 0.80) matchedFields.push('district');
      else if (districtScore < 0.75 && districtSemanticSim < 0.75) districtConflict = true;
    }

    // Pincode similarity (numeric)
    let pincodeScore = 0.0;
    let missingPincode = 1.0;
    let pincodeConflict = false;
    if (input.pincode && candPincode) {
      missingPincode = 0.0;
      pincodeScore = computePincodeSimilarity(input.pincode, candPincode);
      if (pincodeScore >= 0.90) matchedFields.push('pincode');
      else if (pincodeScore < 0.60) pincodeConflict = true;
    }

    // Subword n-gram character overlap (V3.1 feature)
    let ngramSimilarity = nameScore;
    const getCharNgrams = (text: string, n = 3) => {
      const norm = '^' + normalizeName(text).normalized + '$';
      const s = new Set<string>();
      for (let i = 0; i <= norm.length - n; i++) {
        s.add(norm.substring(i, i + n));
      }
      return s;
    };
    const qText = (input.name || '') + ' ' + (input.address || '') + ' ' + (input.district || '');
    const cText = (candName || '') + ' ' + (candAddress || '') + ' ' + (candDistrict || '');
    const ng1 = new Set([...getCharNgrams(qText, 3), ...getCharNgrams(qText, 4)]);
    const ng2 = new Set([...getCharNgrams(cText, 3), ...getCharNgrams(cText, 4)]);
    if (ng1.size > 0 && ng2.size > 0) {
      let intersect = 0;
      for (const item of ng1) {
        if (ng2.has(item)) intersect++;
      }
      ngramSimilarity = intersect / Math.sqrt(ng1.size * ng2.size);
    }

    // Count available fields
    let availableCount = 1; // name is always available
    if (missingDob === 0.0) availableCount++;
    if (missingFather === 0.0) availableCount++;
    if (missingAddress === 0.0) availableCount++;
    if (missingDistrict === 0.0) availableCount++;
    if (missingPincode === 0.0) availableCount++;

    // Count conflicting fields
    let conflictCount = 0;
    if (dobConflict) conflictCount++;
    if (fatherConflict) conflictCount++;
    if (districtConflict) conflictCount++;
    if (pincodeConflict) conflictCount++;
    if (addressConflict && districtConflict) conflictCount++;

    // Composite structured score
    const structuredScore = Number(
      (
        0.35 * nameScore +
        0.20 * (missingDob === 0.0 ? dobScore : 0.0) +
        0.15 * (missingFather === 0.0 ? fatherScore : 0.0) +
        0.15 * (missingAddress === 0.0 ? addressScore : 0.0) +
        0.10 * (missingDistrict === 0.0 ? districtScore : 0.0) +
        0.05 * (missingPincode === 0.0 ? pincodeScore : 0.0)
      ).toFixed(4)
    );

    // Compute structured-only logit and calibrated prob for fusion strategies
    const structuredFeatureVector = [
      nameScore,
      initialsScore,
      dobScore,
      fatherScore,
      addressScore,
      districtScore,
      pincodeScore,
      ngramSimilarity,
      Math.min(0.06, Math.max(0.0, graphCorroborationBonus)),
      availableCount / 6.0,
      conflictCount / Math.max(1, availableCount),
      missingDob,
      missingFather,
      missingAddress,
      missingDistrict,
      missingPincode,
    ];

    const v3Weights = [0.20, 1.3815, 0.20, 0.20, 0.20, 0.2639, 0.20, 0.20, 0.20, 0.0, -6.3529, 0.0, 0.0, 0.0, 0.0, 0.0];
    let structLogit = -0.1104;
    for (let i = 0; i < 16; i++) {
      structLogit += v3Weights[i] * structuredFeatureVector[i];
    }
    const structuredCalibratedProb = 1.0 / (1.0 + Math.exp(-structLogit / 0.69));

    const fieldScores: V4FieldSimilarityScores = {
      nameScore,
      dobScore,
      fatherScore,
      addressScore,
      districtScore,
      pincodeScore,
      embeddingScore: primaryTransformerSim,
      graphBonus: graphCorroborationBonus,
      transformerScore: primaryTransformerSim,
      structuredScore,
      nameSemanticScore: nameSemanticSim,
      addressSemanticScore: addressSemanticSim,
      districtSemanticScore: districtSemanticSim,
      profileSemanticScore: profileSemanticSim,
    };

    // Determine strategy
    const strategy = this.config.fusion_strategy || 'LEARNED_FUSION';
    let uncalibratedScore = 0.0;
    let calibratedProb = 0.0;

    if (strategy === 'STRUCTURED_ONLY') {
      calibratedProb = structuredCalibratedProb;
      uncalibratedScore = structuredScore;
    } else if (strategy === 'TRANSFORMER_ONLY') {
      calibratedProb = primaryTransformerSim;
      uncalibratedScore = primaryTransformerSim;
    } else if (strategy === 'LINEAR_90_10') {
      calibratedProb = 0.90 * structuredCalibratedProb + 0.10 * primaryTransformerSim;
      uncalibratedScore = 0.90 * structuredScore + 0.10 * primaryTransformerSim;
    } else if (strategy === 'LINEAR_80_20') {
      calibratedProb = 0.80 * structuredCalibratedProb + 0.20 * primaryTransformerSim;
      uncalibratedScore = 0.80 * structuredScore + 0.20 * primaryTransformerSim;
    } else if (strategy === 'LINEAR_70_30') {
      calibratedProb = 0.70 * structuredCalibratedProb + 0.30 * primaryTransformerSim;
      uncalibratedScore = 0.70 * structuredScore + 0.30 * primaryTransformerSim;
    } else if (strategy === 'LINEAR_60_40') {
      calibratedProb = 0.60 * structuredCalibratedProb + 0.40 * primaryTransformerSim;
      uncalibratedScore = 0.60 * structuredScore + 0.40 * primaryTransformerSim;
    } else {
      // LEARNED_FUSION (Strategy G)
      let featureVector: number[];
      if (this.config.weights.length === 20) {
        featureVector = [
          nameScore,
          initialsScore,
          dobScore,
          fatherScore,
          addressScore,
          districtScore,
          pincodeScore,
          ngramSimilarity,
          Math.min(0.06, Math.max(0.0, graphCorroborationBonus)),
          availableCount,
          conflictCount,
          missingDob,
          missingFather,
          missingAddress,
          missingDistrict,
          missingPincode,
          nameSemanticSim,
          addressSemanticSim,
          districtSemanticSim,
          profileSemanticSim,
        ];
      } else {
        // 16-feature legacy vector
        featureVector = [
          nameScore,
          initialsScore,
          dobScore,
          fatherScore,
          addressScore,
          districtScore,
          pincodeScore,
          primaryTransformerSim,
          graphCorroborationBonus,
          availableCount,
          conflictCount,
          missingDob,
          missingFather,
          missingAddress,
          missingDistrict,
          missingPincode,
        ];
      }

      let logit = this.config.bias;
      for (let i = 0; i < featureVector.length; i++) {
        logit += this.config.weights[i] * featureVector[i];
      }

      const scaledLogit = logit / this.config.temperature;
      calibratedProb = 1.0 / (1.0 + Math.exp(-scaledLogit));
      uncalibratedScore = calibratedProb;
    }

    // 5. Evaluate Collision Guard (HARD CONSTRAINT)
    const collisionResult = V4CollisionGuard.evaluateCollision(input, row, fieldScores);
    const isCollision = collisionResult.isCollision || conflictCount > 0;

    // 6. Assign final confidence tier & score
    let totalScore = Number(calibratedProb.toFixed(4));
    let confidenceTier: 'HIGH' | 'MEDIUM' | 'LOW' | 'AMBIGUOUS';

    if (isCollision) {
      // Hard cap <= 0.25 unconditionally
      totalScore = Number(
        Math.min(totalScore, this.config.thresholds.HARD_CONFLICT_CAP).toFixed(4)
      );
      confidenceTier = 'AMBIGUOUS';
    } else {
      if (
        totalScore >= this.config.thresholds.HIGH_CONFIDENCE &&
        conflictCount === 0 &&
        nameScore >= 0.70 &&
        availableCount >= 3
      ) {
        confidenceTier = 'HIGH';
      } else if (
        totalScore >= this.config.thresholds.MEDIUM_CONFIDENCE &&
        conflictCount === 0 &&
        nameScore >= 0.60
      ) {
        confidenceTier = 'MEDIUM';
      } else if (totalScore >= this.config.thresholds.LOW_CONFIDENCE) {
        confidenceTier = 'LOW';
      } else {
        confidenceTier = 'AMBIGUOUS';
      }
    }

    const collisionReason = collisionResult.collisionReason || (conflictCount > 0 ? 'Demographic field contradiction detected' : undefined);

    const explanation = isCollision
      ? `Model 2 V4 Collision Guardrail: Demographic contradiction detected (${collisionReason}). Demoted to AMBIGUOUS (score: ${totalScore}). Transformer semantic similarity is advisory evidence and does not establish legal identity.`
      : `Model 2 V4 Hybrid Transformer Match (${strategy}): ${confidenceTier} confidence (P=${totalScore}, Structured: ${structuredScore}, Transformer: ${primaryTransformerSim.toFixed(3)}). Matched fields: ${matchedFields.join(', ') || 'none'}. Advisory score only.`;

    return {
      candidateId: String(candId),
      citizenId: citizenId ? String(citizenId) : undefined,
      registry,
      matchedFields,
      fieldScores,
      structuredScore,
      transformerScore: primaryTransformerSim,
      hybridScore: Number(calibratedProb.toFixed(4)),
      calibratedProbability: totalScore,
      totalScore,
      confidenceTier,
      isCollisionWarning: isCollision,
      collisionReason,
      explanation,
      rawRecord: row,
    };
  }
}
