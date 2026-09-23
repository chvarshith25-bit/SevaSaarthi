/**
 * Seva Saarthi AI Model 2 - Principled Candidate Retrieval Module
 * 
 * Implements deterministic, authorization-aware, multi-tiered SQL candidate retrieval:
 * 1. Multi-token conjunctive prioritization (eliminates unranked LIMIT truncation on common surnames: Kumar, Sharma, Patel, Yadav)
 * 2. Symmetric phonetic and transliteration token expansion (th/t, dh/d, bh/b, ph/f, v/w, c/k, double vowels)
 * 3. Indic script word transliteration (Devanagari / Telugu -> Latin database tokens)
 * 4. Deterministic ordering: token_match_count DESC, demographic_match DESC, id ASC
 * 5. Strict statutory DPDP authorization boundaries: queries ONLY authorized registries.
 */

import { EntityResolutionInput, RegistryKey } from './types';
import { pgQuery } from '../../pg-db';
import { computeNameSimilarity } from './similarity';

export const REGISTRY_TABLE_MAPPING: Record<
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

export const INDIC_WORD_TO_LATIN: Record<string, string[]> = {
  // Hindi / Devanagari
  'अमित': ['AMIT'],
  'पटेल': ['PATEL'],
  'रवि': ['RAVI', 'RAWI'],
  'कुमार': ['KUMAR', 'KUMAAR'],
  'कविता': ['KAVITHA', 'KAVITA', 'CAVITHA', 'CAVITA'],
  'दीपक': ['DEEPAK', 'DIPAK', 'DHEEPAK'],
  'नायडू': ['NAIDU'],
  'राधा': ['RADHA', 'RADA'],
  'वेंकटेश': ['VENKATESH', 'WENKATESH', 'VENKATES'],
  'अनीता': ['ANITHA', 'ANITA'],
  'साईं': ['SAI'],
  'साई': ['SAI'],
  'पूजा': ['POOJA', 'PUJA', 'PHUJA'],
  'कार्तिक': ['KARTHIK', 'KARTIK', 'CARTHIK', 'CARTIK'],
  'हरिता': ['HARITHA', 'HARITA'],
  'किरण': ['KIRAN', 'CIRAN'],
  'स्नेहा': ['SNEHA'],
  'विक्रम': ['VIKRAM', 'WIKRAM'],
  'सुनीता': ['SUNITA', 'SUNEETA'],
  'प्रशांत': ['PRASHANTH', 'PRASHANT', 'PRASANTH', 'PRASANT'],
  'अपर्णा': ['APARNA', 'AAPARNA'],
  'महेश': ['MAHESH', 'MAHES'],
  'लक्ष्मी': ['LAKSHMI', 'LAXMI'],
  'रेड्डी': ['REDDY', 'REDDI'],
  'भावना': ['BHAVANA', 'BAVANA', 'BHAVNA', 'BAWANA'],
  'संजय': ['SANJAY'],
  'प्रिया': ['PRIYA'],
  'यादव': ['YADAV', 'YADAW'],
  'सुरेश': ['SURESH', 'SURES'],
  'वर्मा': ['VERMA', 'WERMA'],
  'शर्मा': ['SHARMA', 'SARMA'],
  'सिंह': ['SINGH', 'SING'],
  'देवी': ['DEVI', 'DEWI'],
  'मनीष': ['MANISH', 'MANIS'],
  'गोपाल': ['GOPAL'],
  'अर्जुन': ['ARJUN'],

  // Telugu
  'అమిత్': ['AMIT'],
  'పటేల్': ['PATEL'],
  'రవి': ['RAVI', 'RAWI'],
  'కుమార్': ['KUMAR', 'KUMAAR'],
  'కవిత': ['KAVITHA', 'KAVITA', 'CAVITHA', 'CAVITA'],
  'దీపక్': ['DEEPAK', 'DIPAK', 'DHEEPAK'],
  'నాయుడు': ['NAIDU'],
  'రాధ': ['RADHA', 'RADA'],
  'రాధా': ['RADHA', 'RADA'],
  'వెంకటేష్': ['VENKATESH', 'WENKATESH', 'VENKATES'],
  'అనిత': ['ANITHA', 'ANITA'],
  'సాయి': ['SAI'],
  'పూజ': ['POOJA', 'PUJA', 'PHUJA'],
  'కార్తీక్': ['KARTHIK', 'KARTIK', 'CARTHIK', 'CARTIK'],
  'హరిత': ['HARITHA', 'HARITA'],
  'కిరణ్': ['KIRAN', 'CIRAN'],
  'స్నేహ': ['SNEHA'],
  'విక్రమ్': ['VIKRAM', 'WIKRAM'],
  'సునీత': ['SUNITA', 'SUNEETA'],
  'ప్రశాంత్': ['PRASHANTH', 'PRASHANT', 'PRASANTH', 'PRASANT'],
  'అపర్ణ': ['APARNA', 'AAPARNA'],
  'మహేష్': ['MAHESH', 'MAHES'],
  'లక్ష్మి': ['LAKSHMI', 'LAXMI'],
  'రెడ్డి': ['REDDY', 'REDDI'],
  'భావన': ['BHAVANA', 'BAVANA', 'BHAVNA', 'BAWANA'],
  'సంజయ్': ['SANJAY'],
  'ప్రియా': ['PRIYA'],
  'యాదవ్': ['YADAV', 'YADAW'],
  'సురేష్': ['SURESH', 'SURES'],
  'వర్మ': ['VERMA', 'WERMA'],
  'శర్మ': ['SHARMA', 'SARMA'],
  'సింగ్': ['SINGH', 'SING'],
  'దేవి': ['DEVI', 'DEWI'],
  'మనీష్': ['MANISH', 'MANIS'],
  'గోపాల్': ['GOPAL'],
  'అర్జున్': ['ARJUN'],
};

/**
 * Expands a Latin token with symmetric phonetic variants for Indian naming contexts.
 */
export function expandSymmetricPhoneticVariants(token: string): string[] {
  const upper = token.toUpperCase().trim();
  if (upper.length === 0) return [];
  const variants = new Set<string>();

  // 1. Add canonical reduced form FIRST
  const canonical = upper
    .replace(/AA/g, 'A')
    .replace(/EE/g, 'I')
    .replace(/OO/g, 'U')
    .replace(/W/g, 'V')
    .replace(/C(?=[AEIOUKLMRN])/g, 'K')
    .replace(/TH/g, 'T')
    .replace(/DH/g, 'D')
    .replace(/BH/g, 'B')
    .replace(/PH/g, 'F')
    .replace(/SH/g, 'S');

  variants.add(canonical);
  variants.add(upper);

  // Helper to branch mutations
  const addTransforms = (str: string) => {
    // th <-> t
    variants.add(str.replace(/TH/g, 'T'));
    variants.add(str.replace(/\bT(?=[AEIOU])/g, 'TH'));
    
    // dh <-> d
    variants.add(str.replace(/DH/g, 'D'));
    variants.add(str.replace(/\bD(?=[AEIOU])/g, 'DH'));

    // bh <-> b
    variants.add(str.replace(/BH/g, 'B'));
    variants.add(str.replace(/\bB(?=[AEIOU])/g, 'BH'));

    // ph <-> f
    variants.add(str.replace(/PH/g, 'F'));
    variants.add(str.replace(/F/g, 'PH'));

    // v <-> w
    variants.add(str.replace(/V/g, 'W'));
    variants.add(str.replace(/W/g, 'V'));

    // c <-> k
    variants.add(str.replace(/C(?=[AEIOUKLMRN])/g, 'K'));
    variants.add(str.replace(/K(?=[AEIOULMRN])/g, 'C'));

    // sh <-> s
    variants.add(str.replace(/SH/g, 'S'));
    variants.add(str.replace(/S(?=[AEIOUKLMRN])/g, 'SH'));

    // double vowels <-> single vowels
    variants.add(str.replace(/AA/g, 'A'));
    variants.add(str.replace(/EE/g, 'I'));
    variants.add(str.replace(/OO/g, 'U'));
    variants.add(str.replace(/A(?=[^A])/g, 'AA'));
    variants.add(str.replace(/I(?=[^I])/g, 'EE'));
    variants.add(str.replace(/U(?=[^U])/g, 'OO'));
  };

  const initialList = Array.from(variants);
  for (const item of initialList) {
    addTransforms(item);
  }

  // Second pass for compound changes (e.g. cawita -> kavitha: c->k and w->v and t->th)
  const pass2 = Array.from(variants);
  for (const item of pass2) {
    let comp = item
      .replace(/C/g, 'K')
      .replace(/W/g, 'V')
      .replace(/T(?=[AEIOU]|$)/g, 'TH')
      .replace(/AA/g, 'A')
      .replace(/EE/g, 'I')
      .replace(/OO/g, 'U');
    variants.add(comp);

    let comp2 = item
      .replace(/K/g, 'C')
      .replace(/V/g, 'W')
      .replace(/TH/g, 'T');
    variants.add(comp2);
  }

  return Array.from(variants).filter((v) => v.length >= 2);
}

/**
 * Extracts structured, word-grouped search tokens from query name.
 * Each element in the returned array represents a word position and its candidate token variants.
 */
export function extractSearchTokenGroups(name?: string | null): string[][] {
  if (!name || typeof name !== 'string') return [];
  const rawWords = name.trim().split(/[\s\.\,\_\-\/]+/).filter((w) => w.length > 0);
  if (rawWords.length === 0) return [];

  const groups: string[][] = [];

  for (const word of rawWords) {
    // 1. Check Indic dictionary
    if (INDIC_WORD_TO_LATIN[word]) {
      const indicVariants = new Set<string>();
      for (const lat of INDIC_WORD_TO_LATIN[word]) {
        for (const v of expandSymmetricPhoneticVariants(lat)) {
          indicVariants.add(v);
        }
      }
      groups.push(Array.from(indicVariants));
      continue;
    }

    // 2. Clean Latin characters
    const cleanLatin = word.replace(/[^A-Za-z]/g, '').toUpperCase();
    if (cleanLatin.length === 1) {
      // Single character / Initial
      groups.push([cleanLatin]);
    } else if (cleanLatin.length >= 2) {
      const variants = expandSymmetricPhoneticVariants(cleanLatin);
      groups.push(variants);
    }
  }

  return groups;
}

export interface RetrievedCandidate {
  row: Record<string, any>;
  registry: RegistryKey;
  tokenMatchScore?: number;
}

/**
 * Deterministic, multi-tiered SQL candidate retrieval.
 * Eliminates unranked LIMIT truncation on common surnames.
 */
export async function retrieveAuthorizedCandidates(
  input: EntityResolutionInput,
  topN: number = 25
): Promise<RetrievedCandidate[]> {
  if (!input.allowedRegistries || input.allowedRegistries.length === 0) {
    return [];
  }

  const tokenGroups = extractSearchTokenGroups(input.name);
  const uniqueRegistries = Array.from(new Set(input.allowedRegistries));
  const candidatePool: RetrievedCandidate[] = [];

  const limitPerReg = Math.max(20, Math.ceil((topN * 2) / Math.max(1, uniqueRegistries.length)));

  for (const regKey of uniqueRegistries) {
    const regNorm = ((regKey as string) === 'pan' || regKey === 'pan_tax_registry')
      ? 'pan_tax_registry'
      : ((regKey as string).endsWith('_registry') ? regKey : (`${regKey}_registry` as RegistryKey));

    const mapping = REGISTRY_TABLE_MAPPING[regNorm];
    if (!mapping) continue;

    const params: any[] = [];
    const groupCaseClauses: string[] = [];
    const allWhereOrClauses: string[] = [];

    // 1. Build Token Match Clauses
    for (const group of tokenGroups) {
      const groupTokens = group.slice(0, 16); // Top variants per group
      const variantConditions: string[] = [];
      for (const tok of groupTokens) {
        params.push(`%${tok}%`);
        variantConditions.push(`${mapping.nameCol} ILIKE $${params.length}`);
      }
      if (variantConditions.length > 0) {
        const groupCond = `(${variantConditions.join(' OR ')})`;
        groupCaseClauses.push(`(CASE WHEN ${groupCond} THEN 1 ELSE 0 END)`);
        allWhereOrClauses.push(groupCond);
      }
    }

    // 2. Identity Reference Clause
    if (mapping.refCol) {
      const refVal = (regNorm === 'pan_tax_registry' && input.panReference)
        ? input.panReference
        : input.identityReference;
      if (refVal) {
        params.push(refVal);
        const refCond = `${mapping.refCol} = $${params.length}`;
        allWhereOrClauses.push(refCond);
      }
    }

    // 3. DOB Clause
    let dobParamIdx = 0;
    const isCleanDate = input.dateOfBirth && /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(input.dateOfBirth);
    if (mapping.dobCol && isCleanDate) {
      params.push(input.dateOfBirth);
      dobParamIdx = params.length;
      allWhereOrClauses.push(`${mapping.dobCol}::text = $${dobParamIdx}`);
    }

    // 4. Father / Guardian Clause
    let fatherParamIdx = 0;
    const qFather = input.fatherName || input.guardianName;
    if (mapping.fatherCol && qFather) {
      params.push(`%${qFather.trim()}%`);
      fatherParamIdx = params.length;
    }

    // 5. District Clause
    let distParamIdx = 0;
    if (mapping.districtCol && input.district) {
      params.push(`%${input.district.trim()}%`);
      distParamIdx = params.length;
    }

    if (allWhereOrClauses.length === 0) {
      continue;
    }

    const tokenScoreExpr = groupCaseClauses.length > 0
      ? `(${groupCaseClauses.join(' + ')})`
      : '0';

    const dobMatchExpr = dobParamIdx > 0
      ? `(CASE WHEN ${mapping.dobCol}::text = $${dobParamIdx} THEN 2 ELSE 0 END)`
      : '0';

    const fatherMatchExpr = fatherParamIdx > 0
      ? `(CASE WHEN ${mapping.fatherCol} ILIKE $${fatherParamIdx} THEN 1 ELSE 0 END)`
      : '0';

    const distMatchExpr = distParamIdx > 0
      ? `(CASE WHEN ${mapping.districtCol} ILIKE $${distParamIdx} THEN 1 ELSE 0 END)`
      : '0';

    const querySql = `
      SELECT *,
        ${tokenScoreExpr} AS __token_score,
        ${dobMatchExpr} AS __dob_score,
        ${fatherMatchExpr} AS __father_score,
        ${distMatchExpr} AS __dist_score
      FROM ${mapping.tableName}
      WHERE ${allWhereOrClauses.join(' OR ')}
      ORDER BY
        __token_score DESC,
        __dob_score DESC,
        __father_score DESC,
        __dist_score DESC,
        id ASC
      LIMIT ${limitPerReg}
    `;

    try {
      const rows = await pgQuery(querySql, params);
      for (const row of rows) {
        const candName = row[mapping.nameCol] || row.name || row.full_name || '';
        const nameSim = computeNameSimilarity(input.name, candName);
        const tokenScore = Number(row.__token_score || 0);

        // Keep candidates that matched tokens or have reasonable similarity
        if (tokenScore > 0 || nameSim >= 0.20 || row.__dob_score > 0) {
          candidatePool.push({
            row,
            registry: regNorm,
            tokenMatchScore: tokenScore,
          });
        }
      }
    } catch (err) {
      console.warn(`[CandidateRetriever] Error querying registry ${regKey}:`, err);
    }
  }

  // Deterministically sort and deduplicate merged candidates across registries
  const seenCandidateKeys = new Set<string>();
  const uniqueCandidates: RetrievedCandidate[] = [];

  // Sort candidate pool by token match score DESC, lexical similarity DESC, then id
  const sortedPool = [...candidatePool].sort((a, b) => {
    const scoreA = (a.tokenMatchScore || 0);
    const scoreB = (b.tokenMatchScore || 0);
    if (scoreB !== scoreA) return scoreB - scoreA;

    const nameA = a.row.name || a.row.student_name || a.row.farmer_name || a.row.beneficiary_name || a.row.applicant_name || a.row.owner_name || '';
    const nameB = b.row.name || b.row.student_name || b.row.farmer_name || b.row.beneficiary_name || b.row.applicant_name || b.row.owner_name || '';
    const simA = computeNameSimilarity(input.name, nameA);
    const simB = computeNameSimilarity(input.name, nameB);
    if (Math.abs(simB - simA) > 0.001) return simB - simA;

    if (input.dateOfBirth) {
      const dobA = (a.row.dob === input.dateOfBirth || a.row.date_of_birth === input.dateOfBirth) ? 1 : 0;
      const dobB = (b.row.dob === input.dateOfBirth || b.row.date_of_birth === input.dateOfBirth) ? 1 : 0;
      if (dobB !== dobA) return dobB - dobA;
    }

    const qFather = input.fatherName || input.guardianName;
    if (qFather) {
      const fatherA = (a.row.father_name || a.row.guardian_name) ? computeNameSimilarity(qFather, a.row.father_name || a.row.guardian_name) : 0;
      const fatherB = (b.row.father_name || b.row.guardian_name) ? computeNameSimilarity(qFather, b.row.father_name || b.row.guardian_name) : 0;
      if (Math.abs(fatherB - fatherA) > 0.05) return fatherB - fatherA;
    }

    return (a.row.id || 0) - (b.row.id || 0);
  });

  for (const cand of sortedPool) {
    const key = `${cand.registry}:${cand.row.id}`;
    if (!seenCandidateKeys.has(key)) {
      seenCandidateKeys.add(key);
      uniqueCandidates.push(cand);
    }
  }

  return uniqueCandidates.slice(0, topN);
}
