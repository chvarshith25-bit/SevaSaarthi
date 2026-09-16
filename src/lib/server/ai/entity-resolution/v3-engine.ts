/**
 * AI Model 2 V3.1 Calibrated Supervised Entity Resolution Engine (Phase 7E.4.1 Integrity Fix)
 * Combines 16-dimensional monotonic feature schema:
 * - Direct field similarities (0.0 when missing, non-negative weights >= +0.20)
 * - Explicit missingness indicators (non-positive weights <= 0.0)
 * - Demographic conflict penalties (strictly negative <= -3.0)
 * - Subword n-gram character embeddings
 * - Cross-registry graph corroboration
 * - Platt temperature scaling (T=0.69)
 * - Hard runtime integrity assertions
 */

import {
  EntityResolutionInput,
  CandidateMatchResult,
  EntityResolutionResponse,
  RegistryKey,
  ENTITY_RESOLUTION_THRESHOLDS,
  FieldSimilarityScores,
} from './types';
import { normalizeName, normalizeDate, normalizeAddress, normalizePincode } from './normalizer';
import {
  computeNameSimilarity,
  computeDobSimilarity,
  computeAddressSimilarity,
  computeDistrictSimilarity,
  computePincodeSimilarity,
  jaroWinklerSimilarity,
} from './similarity';
import { CrossRegistryGraphCorroborator } from './graph';
import { retrieveAuthorizedCandidates } from './candidate-retriever';
import { getAuthoritativeDb } from '../../pg-db';

export interface Model2V3Weights {
  version: string;
  model_name?: string;
  model_type: string;
  feature_names: string[];
  weights: number[];
  bias: number;
  temperature: number;
  thresholds: {
    HIGH_CONFIDENCE: number;
    MEDIUM_CONFIDENCE: number;
    LOW_CONFIDENCE: number;
    HARD_CONFLICT_CAP: number;
  };
}

export const EXPECTED_V3_FEATURE_NAMES = [
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
];

const DEFAULT_V3_CONFIG: Model2V3Weights = {
  version: 'v3.1.0',
  model_name: 'entity-resolver-v3',
  model_type: 'Calibrated Monotonic Supervised Entity Resolution (Phase 7E.4.1 Integrity Fix)',
  feature_names: EXPECTED_V3_FEATURE_NAMES,
  weights: [
    0.2000,
    1.3815,
    0.2000,
    0.2000,
    0.2000,
    0.2639,
    0.2000,
    0.2000,
    0.2000,
    0.0000,
    -6.3529,
    0.0000,
    0.0000,
    0.0000,
    0.0000,
    0.0000,
  ],
  bias: -0.1104,
  temperature: 0.69,
  thresholds: {
    HIGH_CONFIDENCE: 0.85,
    MEDIUM_CONFIDENCE: 0.60,
    LOW_CONFIDENCE: 0.35,
    HARD_CONFLICT_CAP: 0.25,
  },
};

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

export class EntityResolutionEngineV3 {
  private static config: Model2V3Weights = DEFAULT_V3_CONFIG;

  public static setModelConfig(cfg: Model2V3Weights): void {
    this.assertConfigIntegrity(cfg);
    this.config = cfg;
  }

  public static getModelConfig(): Model2V3Weights {
    return this.config;
  }

  public static assertConfigIntegrity(cfg: Model2V3Weights): void {
    if (!cfg.feature_names || cfg.feature_names.length !== 16) {
      throw new Error(`[EntityResolutionEngineV3] Feature count mismatch: expected 16, got ${cfg.feature_names?.length}`);
    }
    if (!cfg.weights || cfg.weights.length !== 16) {
      throw new Error(`[EntityResolutionEngineV3] Weight count mismatch: expected 16, got ${cfg.weights?.length}`);
    }
    for (let i = 0; i < 16; i++) {
      if (cfg.feature_names[i] !== EXPECTED_V3_FEATURE_NAMES[i]) {
        throw new Error(`[EntityResolutionEngineV3] Feature ordering mismatch at index ${i}: expected '${EXPECTED_V3_FEATURE_NAMES[i]}', got '${cfg.feature_names[i]}'`);
      }
    }
    if (typeof cfg.temperature !== 'number' || cfg.temperature <= 0) {
      throw new Error(`[EntityResolutionEngineV3] Invalid calibration temperature: ${cfg.temperature}`);
    }
  }

  private static sigmoid(z: number): number {
    const clamped = Math.max(Math.min(z, 20), -20);
    return 1.0 / (1.0 + Math.exp(-clamped));
  }

  public static checkInitials(n1: string, n2: string): number {
    const t1 = normalizeName(n1).tokens;
    const t2 = normalizeName(n2).tokens;
    if (!t1.length || !t2.length) return 0.0;
    const hasInit = t1.some(t => t.length === 1) || t2.some(t => t.length === 1);
    if (!hasInit) return 0.0;
    const shared = t1.filter(t => t.length > 1 && t2.includes(t));
    return shared.length > 0 ? 1.0 : 0.0;
  }

  /**
   * Extract clean 16-dimensional feature vector without phantom imputation.
   */
  public static extractFeaturesV3(
    input: EntityResolutionInput,
    rawRecord: Record<string, any>,
    registry: RegistryKey | string,
    graphCorrobBonus: number = 0.0
  ): {
    features: number[];
    isCollision: boolean;
    conflictCount: number;
    candName: string;
    candDob?: string;
    candFather?: string;
    candAddress?: string;
    candDistrict?: string;
    candPincode?: string;
    fieldScores: FieldSimilarityScores;
    matchedFields: string[];
    regNorm: RegistryKey;
    candidateId: string;
    citizenId?: string;
  } {
    const regNorm = ((registry as string) === 'pan' || registry === 'pan_tax_registry')
      ? 'pan_tax_registry'
      : ((registry as string).endsWith('_registry') ? registry : (registry + '_registry')) as RegistryKey;
    const mapping = REGISTRY_TABLE_MAPPING[regNorm] || REGISTRY_TABLE_MAPPING.revenue_registry;
    const candidateId = String(rawRecord.id || rawRecord[mapping.refCol || 'id'] || 'UNKNOWN');
    const citizenId = rawRecord.citizen_id || rawRecord.master_citizen_id || undefined;

    // Field extractions
    const candName = rawRecord[mapping.nameCol] || rawRecord.name || rawRecord.full_name || '';
    const candDob = mapping.dobCol ? rawRecord[mapping.dobCol] : rawRecord.dob || rawRecord.date_of_birth;
    const candFather = mapping.fatherCol ? rawRecord[mapping.fatherCol] : rawRecord.father_name || rawRecord.guardian_name;
    const candAddress = mapping.addressCol ? rawRecord[mapping.addressCol] : rawRecord.address;
    const candDistrict = mapping.districtCol ? rawRecord[mapping.districtCol] : rawRecord.district;
    const candPincode = rawRecord.pincode;

    // 16-dimensional feature extraction matching clean training schema
    const nameSim = computeNameSimilarity(input.name, candName);
    const initialsCompat = this.checkInitials(input.name, candName);

    const hasDob = !!(input.dateOfBirth && candDob);
    const dobSim = hasDob ? computeDobSimilarity(input.dateOfBirth!, candDob) : 0.0;
    const missingDob = hasDob ? 0.0 : 1.0;

    const queryFather = input.fatherName || input.guardianName;
    const hasFather = !!(queryFather && candFather);
    const fatherSim = hasFather ? computeNameSimilarity(queryFather, candFather) : 0.0;
    const missingFather = hasFather ? 0.0 : 1.0;

    const hasAddress = !!(input.address && candAddress);
    const addressSim = hasAddress ? computeAddressSimilarity(input.address!, candAddress) : 0.0;
    const missingAddress = hasAddress ? 0.0 : 1.0;

    const hasDistrict = !!(input.district && candDistrict);
    const distSim = hasDistrict ? computeDistrictSimilarity(input.district!, candDistrict) : 0.0;
    const missingDistrict = hasDistrict ? 0.0 : 1.0;

    const hasPincode = !!(input.pincode && candPincode);
    const pinSim = hasPincode ? computePincodeSimilarity(input.pincode!, candPincode) : 0.0;
    const missingPincode = hasPincode ? 0.0 : 1.0;

    // Subword n-gram similarity
    let ngramSimilarity = nameSim;
    if (input.enableSemanticEmbeddings !== false) {
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
    }

    const graphCorroboration = Math.min(0.06, Math.max(0.0, graphCorrobBonus));

    const availableFieldsCount = 1.0 + (1.0 - missingDob) + (1.0 - missingFather) + (1.0 - missingAddress) + (1.0 - missingDistrict) + (1.0 - missingPincode);
    const availableFieldFraction = availableFieldsCount / 6.0;

    let conflictCount = 0;
    if (hasDob && dobSim < 0.60) conflictCount++;
    if (hasFather && fatherSim < 0.60) conflictCount++;
    if (hasDistrict && distSim < 0.60) conflictCount++;
    if (hasPincode && pinSim < 0.60) conflictCount++;
    if (hasAddress && addressSim < 0.15) conflictCount++;

    const conflictingFieldFraction = conflictCount / availableFieldsCount;

    const featureVector = [
      nameSim,
      initialsCompat,
      dobSim,
      fatherSim,
      addressSim,
      distSim,
      pinSim,
      ngramSimilarity,
      graphCorroboration,
      availableFieldFraction,
      conflictingFieldFraction,
      missingDob,
      missingFather,
      missingAddress,
      missingDistrict,
      missingPincode,
    ];

    // Hard Runtime Feature Assertion
    if (featureVector.length !== 16) {
      throw new Error(`[EntityResolutionEngineV3] Feature vector length assertion failed: expected 16, got ${featureVector.length}`);
    }

    const isCollision = (nameSim >= 0.70 || initialsCompat >= 0.80) && (conflictCount > 0);

    const matchedFields: string[] = [];
    if (nameSim >= 0.7) matchedFields.push('name');
    if (dobSim >= 0.8) matchedFields.push('dateOfBirth');
    if (fatherSim >= 0.7) matchedFields.push('fatherName');
    if (addressSim >= 0.6) matchedFields.push('address');
    if (distSim >= 0.8) matchedFields.push('district');
    if (pinSim >= 0.8) matchedFields.push('pincode');

    const fieldScores: FieldSimilarityScores = {
      nameScore: nameSim,
      dobScore: dobSim,
      fatherScore: fatherSim,
      addressScore: addressSim,
      districtScore: distSim,
      pincodeScore: pinSim,
      embeddingScore: ngramSimilarity,
      graphBonus: graphCorrobBonus,
    };

    return {
      features: featureVector,
      isCollision,
      conflictCount,
      candName,
      candDob,
      candFather,
      candAddress,
      candDistrict,
      candPincode,
      fieldScores,
      matchedFields,
      regNorm,
      candidateId,
      citizenId,
    };
  }

  /**
   * Evaluate a candidate record using calibrated monotonic supervised Model 2 V3.
   */
  public static evaluateCandidateV3(
    input: EntityResolutionInput,
    rawRecord: Record<string, any>,
    registry: RegistryKey | string,
    graphCorrobBonus: number = 0.0
  ): CandidateMatchResult {
    const extracted = this.extractFeaturesV3(input, rawRecord, registry, graphCorrobBonus);
    const { features, isCollision, conflictCount, fieldScores, matchedFields, regNorm, candidateId, citizenId } = extracted;

    // Hard Runtime Assertions
    const { weights, bias, temperature, thresholds } = this.config;
    if (features.length !== weights.length) {
      throw new Error(`[EntityResolutionEngineV3] Dimension mismatch: ${features.length} features vs ${weights.length} weights`);
    }

    // Compute logit & calibrated probability
    let logit = bias;
    for (let i = 0; i < features.length; i++) {
      logit += (weights[i] || 0.0) * features[i];
    }
    let calibratedProb = this.sigmoid(logit / (temperature || 1.0));

    // Collision detection
    let collisionReason: string | undefined;
    if (isCollision) {
      collisionReason = 'High name similarity with conflicting demographic fields (DOB/Father/District/Address). Flagged for mandatory manual review.';
      calibratedProb = Math.min(calibratedProb, thresholds.HARD_CONFLICT_CAP);
    }

    // Confidence tier
    const availableFieldCount = features[9] * 6.0;
    let confidenceTier: 'HIGH' | 'MEDIUM' | 'LOW' | 'AMBIGUOUS';
    if (isCollision) {
      confidenceTier = 'AMBIGUOUS';
    } else if (calibratedProb >= thresholds.HIGH_CONFIDENCE && conflictCount === 0 && features[0] >= 0.70 && availableFieldCount >= 3.0) {
      confidenceTier = 'HIGH';
    } else if (calibratedProb >= thresholds.MEDIUM_CONFIDENCE && conflictCount === 0 && features[0] >= 0.70) {
      confidenceTier = 'MEDIUM';
    } else if (calibratedProb >= thresholds.LOW_CONFIDENCE) {
      confidenceTier = 'AMBIGUOUS';
    } else {
      confidenceTier = 'LOW';
    }

    return {
      candidateId,
      citizenId,
      registry: regNorm,
      matchedFields,
      fieldScores,
      totalScore: Number(calibratedProb.toFixed(4)),
      confidenceTier,
      isCollisionWarning: isCollision,
      collisionReason,
      corroborationReason: graphCorrobBonus > 0 ? ('Cross-registry corroboration bonus applied (+' + graphCorrobBonus.toFixed(3) + ')') : undefined,
      explanation: 'Model 2 V3.1 Calibrated Probability: ' + (calibratedProb * 100).toFixed(1) + '% (Tier: ' + confidenceTier + ', Matched fields: ' + (matchedFields.join(', ') || 'none') + ')',
      rawRecord,
    };
  }

  /**
   * Primary entry point: Find and rank candidate citizen records across authorized registries.
   */
  public static async matchEntityV3(input: EntityResolutionInput): Promise<EntityResolutionResponse> {
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

    let candidateResults: CandidateMatchResult[] = [];
    const rawCandidates = await retrieveAuthorizedCandidates(input, 50);

    for (const item of rawCandidates) {
      const candidate = this.evaluateCandidateV3(input, item.row, item.registry, 0.0);
      candidateResults.push(candidate);
    }

    if (input.enableGraphCorroboration !== false && candidateResults.length > 0) {
      const graphCorroborationMap = CrossRegistryGraphCorroborator.corroborateCandidates(candidateResults);
      candidateResults = candidateResults.map((cand) => {
        const graphResult = graphCorroborationMap.get(cand.candidateId);
        if (graphResult && graphResult.corroborationBonus > 0 && !cand.isCollisionWarning) {
          return this.evaluateCandidateV3(input, cand.rawRecord, cand.registry, graphResult.corroborationBonus);
        }
        return cand;
      });
    }

    // Phase 7E.6.1: Identity-Level Candidate Consolidation & Collision Propagation
    const { consolidatedCandidates, ambiguityDetected } = this.consolidateIdentityCandidates(
      input,
      candidateResults,
      this.config.thresholds
    );

    return {
      querySummary: {
        name: input.name,
        searchedRegistries: input.allowedRegistries,
        totalCandidatesFound: consolidatedCandidates.length,
        embeddingModelId: 'calibrated-monotonic-v3.1.0',
      },
      candidates: consolidatedCandidates,
      bestMatch: consolidatedCandidates.length > 0 ? consolidatedCandidates[0] : undefined,
      ambiguityDetected,
      disclaimer:
        'AI Model 2 V3.1 Advisory Matcher: Candidate rankings and calibrated posterior probabilities are strictly advisory. Final statutory identity determination requires authorized officer verification.',
    };
  }

  /**
   * Phase 7E.6.1: Consolidate raw candidate records by master_citizen_id and propagate collisions.
   * Ensures that:
   * 1. Multiple rows belonging to the same master_citizen_id are unified into ONE identity candidate.
   * 2. If ANY record for an identity has a collision warning / demographic contradiction, the ENTIRE identity is marked AMBIGUOUS (<= 0.25).
   * 3. Sparse records cannot bypass contradictions found in complete records.
   * 4. Multi-registry evidence is aggregated across all source records.
   * 5. Self-ties between records of the same citizen are eliminated.
   */
  public static consolidateIdentityCandidates(
    input: EntityResolutionInput,
    rawCandidates: CandidateMatchResult[],
    thresholds: Model2V3Weights['thresholds']
  ): { consolidatedCandidates: CandidateMatchResult[]; ambiguityDetected: boolean } {
    if (rawCandidates.length === 0) {
      return { consolidatedCandidates: [], ambiguityDetected: false };
    }

    // 1. Group candidate records by master citizen identity
    const identityClusters = new Map<string, CandidateMatchResult[]>();
    for (const cand of rawCandidates) {
      const clusterKey = cand.citizenId || cand.rawRecord?.citizen_id || cand.rawRecord?.master_citizen_id || cand.candidateId;
      if (!identityClusters.has(clusterKey)) {
        identityClusters.set(clusterKey, []);
      }
      identityClusters.get(clusterKey)!.push(cand);
    }

    const consolidatedList: CandidateMatchResult[] = [];

    // 2. Process and consolidate each identity cluster
    for (const [citizenId, records] of identityClusters.entries()) {
      // Check if ANY record in the identity cluster has a collision warning or conflict
      const collidingRecord = records.find((r) => r.isCollisionWarning || r.confidenceTier === 'AMBIGUOUS');
      
      const allSupportingRegistries = Array.from(new Set(records.map((r) => r.registry)));
      const allSupportingRecordIds = records.map((r) => r.candidateId);
      const allMatchedFields = Array.from(new Set(records.flatMap((r) => r.matchedFields)));

      // Aggregate best field scores across all records of this identity
      const aggregatedFieldScores: FieldSimilarityScores = {
        nameScore: Math.max(...records.map((r) => r.fieldScores.nameScore || 0.0)),
        dobScore: Math.max(...records.map((r) => r.fieldScores.dobScore || 0.0)),
        fatherScore: Math.max(...records.map((r) => r.fieldScores.fatherScore || 0.0)),
        addressScore: Math.max(...records.map((r) => r.fieldScores.addressScore || 0.0)),
        districtScore: Math.max(...records.map((r) => r.fieldScores.districtScore || 0.0)),
        pincodeScore: Math.max(...records.map((r) => r.fieldScores.pincodeScore || 0.0)),
        embeddingScore: Math.max(...records.map((r) => r.fieldScores.embeddingScore || 0.0)),
        graphBonus: Math.max(...records.map((r) => r.fieldScores.graphBonus || 0.0)),
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
          totalScore: Number(Math.min(minScore, thresholds.HARD_CONFLICT_CAP).toFixed(4)),
          confidenceTier: 'AMBIGUOUS',
          isCollisionWarning: true,
          collisionReason: representative.collisionReason || 'High name similarity with conflicting demographic fields in authorized registry.',
          supportingRegistries: allSupportingRegistries,
          supportingRecordIds: allSupportingRecordIds,
          identityRecordCount: records.length,
          explanation: `Model 2 V3.1 Collision Guardrail: Identity ${citizenId} has conflicting demographic vectors in ${representative.registry}. Demoted to AMBIGUOUS for mandatory officer review.`,
          rawRecord: representative.rawRecord,
        });
      } else {
        // Non-colliding clean identity: Sort records by completeness and score
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
          totalScore: primaryRecord.totalScore,
          confidenceTier: primaryRecord.confidenceTier,
          isCollisionWarning: false,
          corroborationReason: primaryRecord.corroborationReason || (allSupportingRegistries.length > 1 ? `Corroborated across ${allSupportingRegistries.length} registries: ${allSupportingRegistries.join(', ')}` : undefined),
          supportingRegistries: allSupportingRegistries,
          supportingRecordIds: allSupportingRecordIds,
          identityRecordCount: records.length,
          explanation: primaryRecord.explanation,
          rawRecord: primaryRecord.rawRecord,
        });
      }
    }

    // 3. Person-Level Ranking:
    // Primary: Higher totalScore ranks first
    // Secondary: Higher supporting registry count breaks ties
    // Tertiary: Stable deterministic tie-breaker (citizenId / candidateId)
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
      } else if (top1.totalScore >= 0.60 && top2.totalScore >= 0.60 && (top1.totalScore - top2.totalScore < 0.05)) {
        ambiguityDetected = true;
      }
    } else if (consolidatedList.length === 1 && (consolidatedList[0].confidenceTier === 'AMBIGUOUS' || consolidatedList[0].isCollisionWarning)) {
      ambiguityDetected = true;
    }

    return { consolidatedCandidates: consolidatedList, ambiguityDetected };
  }
}
