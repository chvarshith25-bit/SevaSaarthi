/**
 * Seva Saarthi AI Orchestrator (Phase 6: End-to-End AI Integration)
 * 
 * Coordinates the full lifecycle:
 * 1. AI Model 1 Workflow Routing
 * 2. Statutory DPDP Consent Verification Gate
 * 3. AI Model 2 Entity Resolution on Authorized Registries
 * 4. Semantic Data Mapper Payload Normalization
 * 5. Append-Only Audit Trail Logging
 */

import { getAuthoritativeDb, pgQuery, pgRecordAuditEvent } from '../pg-db';
import { EntityResolutionEngine, RegistryKey, CandidateMatchResult, EntityResolutionResponse } from './entity-resolution';
import { calculateAuditTamperHash } from '../db';

export interface IdentityResolutionResult {
  applicationId: string;
  applicationNumber: string;
  consentVerified: boolean;
  authorizedRegistries: RegistryKey[];
  candidates: CandidateMatchResult[];
  bestMatch?: CandidateMatchResult;
  ambiguityDetected: boolean;
  verificationsGenerated: Array<{
    id: string;
    name: string;
    source: string;
    status: 'VERIFIED' | 'FAILED' | 'PENDING' | 'CONFLICT';
    matchScore: number;
    details: string;
    timestamp: string;
  }>;
  explanation: string;
}

/**
 * Maps service / workflow type to authorized government registries.
 * Ensures that AI Model 2 strictly queries only caller-authorized registries.
 */
export function getAuthorizedRegistriesForService(serviceCodeOrName?: string): RegistryKey[] {
  const norm = String(serviceCodeOrName || '').toUpperCase();

  if (norm.includes('SCHOLARSHIP') || norm.includes('NSP') || norm.includes('EDUCATION')) {
    return ['revenue_registry', 'education_registry'];
  }
  if (norm.includes('AGRICULTURE') || norm.includes('KISAN') || norm.includes('FARMER')) {
    return ['agriculture_registry', 'land_registry', 'revenue_registry'];
  }
  if (norm.includes('LAND') || norm.includes('BHOOMI') || norm.includes('MUTATION') || norm.includes('ROR')) {
    return ['land_registry', 'revenue_registry'];
  }
  if (norm.includes('HEALTH') || norm.includes('AYUSHMAN') || norm.includes('PM-JAY')) {
    return ['health_registry', 'revenue_registry'];
  }
  if (norm.includes('HOUSING') || norm.includes('PMAY') || norm.includes('AWAS')) {
    return ['housing_registry', 'revenue_registry'];
  }
  if (norm.includes('PAN') || norm.includes('TAX') || norm.includes('INCOME TAX')) {
    return ['pan_tax_registry', 'revenue_registry'];
  }

  // Default minimum authorized set
  return ['revenue_registry'];
}

/**
 * Resolves citizen identity across permitted government registries after statutory consent verification.
 */
export async function resolveApplicationIdentity(
  applicationIdOrNumber: string,
  options?: {
    forceRecompute?: boolean;
    callerUserId?: string;
  }
): Promise<IdentityResolutionResult> {
  await getAuthoritativeDb();

  // 1. Fetch Application Record & Snapshots
  const appRows = await pgQuery<{
    id: string;
    application_number: string;
    citizen_user_id: string;
    service_id: string;
    status: string;
    service_name?: string;
    created_at: string;
  }>(
    `SELECT a.id, a.application_number, a.citizen_user_id, a.service_id, a.status, a.created_at,
            s.name as service_name, s.code as service_code
     FROM applications a
     LEFT JOIN services s ON a.service_id = s.id
     WHERE a.id::text = $1 OR a.application_number = $1
     LIMIT 1`,
    [applicationIdOrNumber]
  );

  if (appRows.length === 0) {
    throw new Error(`Application not found: ${applicationIdOrNumber}`);
  }

  const app = appRows[0];

  // 2. DPDP Statutory Consent Verification Gate
  const consentRows = await pgQuery<{
    id: string;
    status: string;
    purpose: string;
    created_at: string;
  }>(
    `SELECT id, status, purpose, created_at
     FROM consent_requests
     WHERE application_id = $1 OR citizen_user_id = $2
     ORDER BY created_at DESC LIMIT 1`,
    [app.id, app.citizen_user_id]
  );

  const activeConsent = consentRows[0];
  const isConsentValid = activeConsent && activeConsent.status === 'GRANTED';

  if (!isConsentValid) {
    // Record audit failure
    await pgRecordAuditEvent(
      'SYSTEM',
      options?.callerUserId || 'system-ai-orchestrator',
      'VALIDATE',
      app.id,
      'AI_ORCHESTRATOR',
      'DPDP_CONSENT_GATE',
      'Statutory DPDP Consent Verification Failed',
      'NO_VALID_CONSENT',
      'FAILED',
      { error: 'Statutory consent missing, revoked, or unverified. Model 2 registry access denied.' }
    );

    throw new Error(
      `DPDP Statutory Consent Violation: Application ${app.application_number} lacks verified citizen consent. Model 2 cross-registry retrieval blocked.`
    );
  }

  // 3. Extract Demographic Fields from Profile Snapshot or Memory
  const snapRows = await pgQuery<{ snapshot_data: string }>(
    `SELECT snapshot_data FROM application_profile_snapshots WHERE application_id = $1 ORDER BY profile_version DESC LIMIT 1`,
    [app.id]
  );

  let citizenData: Record<string, any> = {};
  if (snapRows.length > 0 && snapRows[0].snapshot_data) {
    try {
      citizenData = typeof snapRows[0].snapshot_data === 'string'
        ? JSON.parse(snapRows[0].snapshot_data)
        : snapRows[0].snapshot_data;
    } catch {
      citizenData = {};
    }
  }

  const queryName = citizenData.fullName || citizenData.name || '';
  const queryDob = citizenData.dateOfBirth || citizenData.dob || '';
  const queryFather = citizenData.fatherName || citizenData.guardianName || '';
  const queryAddress = citizenData.address || citizenData.residentialAddress || '';
  const queryDistrict = citizenData.district || citizenData.city || '';
  const queryPincode = citizenData.pincode || citizenData.postalCode || '';

  if (!queryName) {
    throw new Error(`Application ${app.application_number} has no demographic name in profile snapshot.`);
  }

  // 4. Determine Authorized Registries
  const allowedRegistries = getAuthorizedRegistriesForService(app.service_name || '');

  // 5. Invoke AI Model 2 Entity Resolution Engine
  const model2Input = {
    name: queryName,
    dateOfBirth: queryDob || undefined,
    fatherName: queryFather || undefined,
    address: queryAddress || undefined,
    district: queryDistrict || undefined,
    pincode: queryPincode || undefined,
    allowedRegistries,
    consentVerified: true,
    purpose: activeConsent.purpose || 'Statutory Cross-Departmental Identity & Record Verification',
  };

  const model2Response: EntityResolutionResponse = await EntityResolutionEngine.matchEntity(model2Input);

  // 6. Semantic Data Mapper Integration: Transform raw registry candidates into canonical verification records
  const now = new Date().toISOString();
  const verificationsGenerated: IdentityResolutionResult['verificationsGenerated'] = [];

  for (const cand of model2Response.candidates) {
    const raw = cand.rawRecord || {};

    if (cand.registry === 'revenue_registry') {
      const income = raw.annual_income || raw.income;
      const certStatus = raw.certificate_status || 'ACTIVE';
      const isIncomeValid = certStatus === 'ACTIVE' && (income ? Number(income) <= 250000 : true);

      verificationsGenerated.push({
        id: `chk_rev_${cand.candidateId}`,
        name: 'Family Annual Income Threshold (Revenue Registry)',
        source: 'State Revenue Department (e-District / Tehsildar)',
        status: isIncomeValid ? 'VERIFIED' : 'PENDING',
        matchScore: cand.totalScore,
        details: `Income Certificate: ${raw.income_certificate_number || 'REV-CERT'} (Annual Income: Rs. ${income || 'N/A'}, Status: ${certStatus})`,
        timestamp: now,
      });
    }

    if (cand.registry === 'education_registry') {
      verificationsGenerated.push({
        id: `chk_edu_${cand.candidateId}`,
        name: 'Student Enrollment & Institution Verification',
        source: 'National Scholarship Portal (NSP / AISHE)',
        status: cand.totalScore >= 0.85 ? 'VERIFIED' : 'PENDING',
        matchScore: cand.totalScore,
        details: `College: ${raw.college_name || 'N/A'} | Course: ${raw.course || 'N/A'} | Scholarship Status: ${raw.scholarship_status || 'SANCTIONED'}`,
        timestamp: now,
      });
    }

    if (cand.registry === 'agriculture_registry') {
      verificationsGenerated.push({
        id: `chk_agri_${cand.candidateId}`,
        name: 'PM-Kisan Farmer Beneficiary Verification',
        source: 'Department of Agriculture & Farmers Welfare',
        status: raw.pm_kisan_status === 'ACTIVE' ? 'VERIFIED' : 'PENDING',
        matchScore: cand.totalScore,
        details: `Land Reference: ${raw.land_reference || 'N/A'} | Village: ${raw.village || 'N/A'} | Status: ${raw.pm_kisan_status || 'ACTIVE'}`,
        timestamp: now,
      });
    }

    if (cand.registry === 'land_registry') {
      verificationsGenerated.push({
        id: `chk_land_${cand.candidateId}`,
        name: 'Land Parcel Ownership & Survey Record Verification',
        source: 'Bhoomi / Revenue RoR 1B Registry',
        status: raw.ownership_status === 'SOLE_OWNER' ? 'VERIFIED' : 'PENDING',
        matchScore: cand.totalScore,
        details: `Survey Number: ${raw.survey_number || 'N/A'} | Area: ${raw.land_area || 'N/A'} | Ownership: ${raw.ownership_status || 'SOLE_OWNER'}`,
        timestamp: now,
      });
    }

    if (cand.registry === 'pan_tax_registry') {
      verificationsGenerated.push({
        id: `chk_pan_${cand.candidateId}`,
        name: 'CBDT PAN Allocation & Tax Status',
        source: 'Income Tax Department (CBDT / Protean)',
        status: raw.pan_status === 'ACTIVE' ? 'VERIFIED' : 'PENDING',
        matchScore: cand.totalScore,
        details: `PAN Status: ${raw.pan_status || 'ACTIVE'} | Category: ${raw.category || 'INDIVIDUAL'}`,
        timestamp: now,
      });
    }
  }

  // 7. Persist Candidates to application_entity_resolutions
  try {
    for (const cand of model2Response.candidates) {
      await pgQuery(
        `INSERT INTO application_entity_resolutions (
           application_id, model_version, candidate_registry, candidate_record_id,
           total_score, field_scores, matched_fields, confidence_tier,
           is_collision_warning, collision_reason, corroboration_reason,
           explanation, raw_record, review_status
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'PENDING')
         ON CONFLICT DO NOTHING`,
        [
          app.id,
          'entity-resolution-v1',
          cand.registry,
          cand.candidateId,
          cand.totalScore,
          JSON.stringify(cand.fieldScores),
          cand.matchedFields,
          cand.confidenceTier,
          cand.isCollisionWarning,
          cand.collisionReason || null,
          cand.corroborationReason || null,
          cand.explanation,
          JSON.stringify(cand.rawRecord || {}),
        ]
      );
    }
  } catch (persistErr) {
    console.warn('[resolveApplicationIdentity] Error persisting candidate matches:', persistErr);
  }

  // 8. Record Append-Only Audit Trail
  await pgRecordAuditEvent(
    'SYSTEM',
    options?.callerUserId || 'system-ai-orchestrator',
    'EXECUTE',
    app.id,
    'AI_MODEL2_ENGINE',
    'ENTITY_RESOLUTION',
    'Cross-Registry Entity Resolution Execution',
    activeConsent.id,
    'SUCCESS',
    {
      searchedRegistries: allowedRegistries,
      candidatesFound: model2Response.candidates.length,
      bestMatchId: model2Response.bestMatch?.candidateId,
      bestMatchScore: model2Response.bestMatch?.totalScore,
      ambiguityDetected: model2Response.ambiguityDetected,
    }
  );

  return {
    applicationId: app.id,
    applicationNumber: app.application_number,
    consentVerified: true,
    authorizedRegistries: allowedRegistries,
    candidates: model2Response.candidates,
    bestMatch: model2Response.bestMatch,
    ambiguityDetected: model2Response.ambiguityDetected,
    verificationsGenerated,
    explanation: model2Response.disclaimer,
  };
}
