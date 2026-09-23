/**
 * AI Model 2 V2.1 Calibrated Supervised Entity Resolution Engine (Phase 7E.1.1 Remediated)
 * Combines engineered multi-field lexical features, semantic n-gram embeddings,
 * cross-registry graph corroboration, logistic regression weights, and Platt calibration.
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
import { pgQuery } from '../../pg-db';

export interface Model2V2Weights {
  version: string;
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

const DEFAULT_V2_CONFIG: Model2V2Weights = {
  version: 'v2.1.1',
  model_type: 'Calibrated Supervised Entity Resolution (Architecturally Corrected)',
  feature_names: ["name_sim", "initials_compat", "dob_sim", "father_sim", "address_sim", "district_sim", "pincode_sim", "ngram_cosine", "agreeing_count", "conflicting_count", "graph_corroboration"],
  weights: [2.80, 0.80, 3.20, 2.00, 2.00, 1.80, 1.20, 1.50, 3.00, -4.50, 0.65],
  bias: -3.20,
  temperature: 0.5,
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

export class EntityResolutionEngineV2 {
  private static config: Model2V2Weights = DEFAULT_V2_CONFIG;

  public static setModelConfig(cfg: Model2V2Weights): void {
    this.config = cfg;
  }

  public static getModelConfig(): Model2V2Weights {
    return this.config;
  }

  private static sigmoid(z: number): number {
    const clamped = Math.max(Math.min(z, 20), -20);
    return 1.0 / (1.0 + Math.exp(-clamped));
  }

  /**
   * Evaluate a candidate record using the calibrated supervised Model 2 V2.1.
   */
  public static evaluateCandidateV2(
    input: EntityResolutionInput,
    rawRecord: Record<string, any>,
    registry: RegistryKey | string,
    graphCorrobBonus: number = 0.0
  ): CandidateMatchResult {
    const regNorm = ((registry as string) === 'pan' || registry === 'pan_tax_registry')
      ? 'pan_tax_registry'
      : ((registry as string).endsWith('_registry') ? registry : `${registry}_registry`) as RegistryKey;
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

    // Compute raw field similarities (missing fields evaluate to 0.0 to prevent phantom score inflation)
    const nameSim = computeNameSimilarity(input.name, candName);
    const initialsCompat = jaroWinklerSimilarity(normalizeName(input.name).normalized, normalizeName(candName).normalized) > 0.8 ? 0.8 : 0.0;
    const dobSim = candDob && input.dateOfBirth ? computeDobSimilarity(input.dateOfBirth, candDob) : 0.0;
    const fatherSim = candFather && input.fatherName ? computeNameSimilarity(input.fatherName, candFather) : 0.0;
    const addressSim = candAddress && input.address ? computeAddressSimilarity(input.address, candAddress) : 0.0;
    const distSim = candDistrict && input.district ? computeDistrictSimilarity(input.district, candDistrict) : 0.0;
    const pinSim = candPincode && input.pincode ? computePincodeSimilarity(input.pincode, candPincode) : 0.0;

    // Subword n-gram embedding similarity
    let ngramCosine = nameSim;
    if (input.enableSemanticEmbeddings !== false) {
      const getCharNgrams = (text: string, n = 3) => {
        const norm = `^${normalizeName(text).normalized}$`;
        const s = new Set<string>();
        for (let i = 0; i <= norm.length - n; i++) {
          s.add(norm.substring(i, i + n));
        }
        return s;
      };
      const qText = `${input.name} ${input.address || ''} ${input.district || ''}`;
      const cText = `${candName} ${candAddress || ''} ${candDistrict || ''}`;
      const ng1 = new Set([...getCharNgrams(qText, 3), ...getCharNgrams(qText, 4)]);
      const ng2 = new Set([...getCharNgrams(cText, 3), ...getCharNgrams(cText, 4)]);
      if (ng1.size > 0 && ng2.size > 0) {
        let intersect = 0;
        for (const item of ng1) {
          if (ng2.has(item)) intersect++;
        }
        ngramCosine = intersect / Math.sqrt(ng1.size * ng2.size);
      }
    }

    // Explicit demographic conflict checks
    let hasDobConflict = false;
    if (candDob && input.dateOfBirth && dobSim < 0.20) hasDobConflict = true;
    let hasFatherConflict = false;
    if (candFather && input.fatherName && fatherSim < 0.20) hasFatherConflict = true;
    let hasDistrictConflict = false;
    if (candDistrict && input.district && distSim < 0.20) hasDistrictConflict = true;
    let hasPincodeConflict = false;
    if (candPincode && input.pincode && pinSim < 0.20) hasPincodeConflict = true;
    let hasAddressConflict = false;
    if (candAddress && input.address && addressSim < 0.20) hasAddressConflict = true;

    const isCollision = (nameSim >= 0.85) && (hasDobConflict || hasFatherConflict || hasDistrictConflict || hasPincodeConflict || hasAddressConflict);

    const presentSims: number[] = [nameSim];
    if (candDob && input.dateOfBirth) presentSims.push(dobSim);
    if (candFather && input.fatherName) presentSims.push(fatherSim);
    if (candAddress && input.address) presentSims.push(addressSim);
    if (candDistrict && input.district) presentSims.push(distSim);
    if (candPincode && input.pincode) presentSims.push(pinSim);

    const agreeingCount = presentSims.filter((s) => s >= 0.70).length / presentSims.length;
    const conflictingCount = (hasDobConflict ? 1.0 : 0.0) + (hasFatherConflict ? 1.0 : 0.0) + (hasDistrictConflict ? 1.0 : 0.0) + (hasPincodeConflict ? 1.0 : 0.0) + (hasAddressConflict ? 1.0 : 0.0);
    const graphFeature = Math.min(0.06, Math.max(0.0, graphCorrobBonus));

    const featureVector = [
      nameSim,
      initialsCompat,
      dobSim,
      fatherSim,
      addressSim,
      distSim,
      pinSim,
      ngramCosine,
      agreeingCount,
      conflictingCount,
      graphFeature,
    ];

    // Compute logit & calibrated probability
    const { weights, bias, temperature, thresholds } = this.config;
    let logit = bias;
    for (let i = 0; i < featureVector.length; i++) {
      logit += (weights[i] || 0.0) * featureVector[i];
    }
    let calibratedProb = this.sigmoid(logit / (temperature || 1.0));

    // Hard Contradiction Guardrail: High name similarity with conflicting demographic vector
    let collisionReason: string | undefined;
    if (isCollision) {
      collisionReason = 'High name similarity but conflicting statutory demographic fields (DOB/Father/District). Flagged for mandatory manual review.';
      calibratedProb = Math.min(calibratedProb, thresholds.HARD_CONFLICT_CAP);
    }

    // Determine Confidence Tier
    let confidenceTier: 'HIGH' | 'MEDIUM' | 'LOW' | 'AMBIGUOUS';
    if (isCollision) {
      confidenceTier = 'AMBIGUOUS';
    } else if (calibratedProb >= thresholds.HIGH_CONFIDENCE && conflictingCount === 0 && nameSim >= 0.70) {
      confidenceTier = 'HIGH';
    } else if (calibratedProb >= thresholds.MEDIUM_CONFIDENCE && conflictingCount === 0) {
      confidenceTier = 'MEDIUM';
    } else if (calibratedProb >= thresholds.LOW_CONFIDENCE) {
      confidenceTier = 'AMBIGUOUS';
    } else {
      confidenceTier = 'LOW';
    }

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
      embeddingScore: ngramCosine,
      graphBonus: graphCorrobBonus,
    };

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
      corroborationReason: graphCorrobBonus > 0 ? `Cross-registry corroboration bonus applied (+${graphCorrobBonus.toFixed(3)})` : undefined,
      explanation: `Model 2 V2.1 Calibrated Probability: ${(calibratedProb * 100).toFixed(1)}% (Tier: ${confidenceTier}, Matched fields: ${matchedFields.join(', ') || 'none'})`,
      rawRecord,
    };
  }

  /**
   * Primary entry point: Find and rank candidate citizen records across authorized registries.
   */
  public static async matchEntityV2(input: EntityResolutionInput): Promise<EntityResolutionResponse> {
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

    const norm = normalizeName(input.name);
    const searchTokens = norm.tokens.filter(t => t.length >= 2);
    if (searchTokens.length === 0 && norm.normalized) {
      searchTokens.push(norm.normalized);
    }

    const uniqueRegistries = Array.from(new Set(input.allowedRegistries));

    for (const regKey of uniqueRegistries) {
      const regNorm = ((regKey as string) === 'pan' || regKey === 'pan_tax_registry')
        ? 'pan_tax_registry'
        : ((regKey as string).endsWith('_registry') ? regKey : `${regKey}_registry`) as RegistryKey;
      const mapping = REGISTRY_TABLE_MAPPING[regNorm] || REGISTRY_TABLE_MAPPING.revenue_registry;

      const conditions: string[] = [];
      const params: any[] = [];
      const tokenConditions: string[] = [];

      for (const tok of searchTokens) {
        params.push('%' + tok + '%');
        tokenConditions.push(mapping.nameCol + ' ILIKE $' + params.length);
      }

      if (mapping.refCol) {
        const refVal = (regNorm === 'pan_tax_registry' && input.panReference)
          ? input.panReference
          : input.identityReference;
        if (refVal) {
          params.push(refVal);
          tokenConditions.push(mapping.refCol + ' = $' + params.length);
        }
      }

      if (tokenConditions.length === 0) continue;
      conditions.push('(' + tokenConditions.join(' OR ') + ')');

      let querySql = `SELECT * FROM ${mapping.tableName} WHERE ${conditions.join(' AND ')} LIMIT 50`;
      try {
        const rows = await pgQuery(querySql, params);

        for (const row of rows) {
          const candName = row[mapping.nameCol] || row.name || row.full_name || '';
          const nameSim = computeNameSimilarity(input.name, candName);
          if (nameSim < 0.35) continue;

          const candidate = this.evaluateCandidateV2(input, row, regNorm, 0.0);
          candidateResults.push(candidate);
        }
      } catch (queryErr) {
        console.warn('[EntityResolutionEngineV2] Query error on registry ' + regKey + ':', queryErr);
      }
    }

    if (input.enableGraphCorroboration !== false && candidateResults.length > 0) {
      const graphCorroborationMap = CrossRegistryGraphCorroborator.corroborateCandidates(candidateResults);
      candidateResults = candidateResults.map((cand) => {
        const graphResult = graphCorroborationMap.get(cand.candidateId);
        if (graphResult && graphResult.corroborationBonus > 0 && !cand.isCollisionWarning) {
          return this.evaluateCandidateV2(input, cand.rawRecord, cand.registry, graphResult.corroborationBonus);
        }
        return cand;
      });
    }

    candidateResults.sort((a, b) => b.totalScore - a.totalScore);

    let ambiguityDetected = false;
    if (candidateResults.length >= 2) {
      const top1 = candidateResults[0];
      const top2 = candidateResults[1];
      if (top1.confidenceTier === 'AMBIGUOUS' || (top1.totalScore >= 0.60 && top2.totalScore >= 0.60 && top1.totalScore - top2.totalScore < 0.05)) {
        ambiguityDetected = true;
      }
    } else if (candidateResults.length === 1 && candidateResults[0].confidenceTier === 'AMBIGUOUS') {
      ambiguityDetected = true;
    }

    return {
      querySummary: {
        name: input.name,
        searchedRegistries: input.allowedRegistries,
        totalCandidatesFound: candidateResults.length,
        embeddingModelId: 'calibrated-supervised-v2.1.1',
      },
      candidates: candidateResults,
      bestMatch: candidateResults.length > 0 ? candidateResults[0] : undefined,
      ambiguityDetected,
      disclaimer:
        'AI Model 2 V2.1 Advisory Matcher: Candidate rankings and calibrated posterior probabilities are strictly advisory. Final statutory identity determination requires authorized officer verification.',
    };
  }
}
