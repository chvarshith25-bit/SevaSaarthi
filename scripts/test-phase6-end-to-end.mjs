/**
 * SEVA SAARTHI PHASE 6: END-TO-END AI INTEGRATION TEST SUITE
 * 
 * Verifies the complete real application flow:
 * 1. Citizen Application Submission -> AI Model 1 Workflow Routing
 * 2. Statutory DPDP Consent Verification Gate
 * 3. AI Model 2 Entity Resolution on Authorized Registries
 * 4. Semantic Data Mapper Payload Transformation
 * 5. Government Officer Workspace Review & Adjudication Actions
 * 6. Append-Only Tamper-Evident Audit Trail Logging
 */

import { getAuthoritativeDb, closeAuthoritativeDb, pgQuery } from '../src/lib/server/pg-db.ts';
import {
  createPanApplication,
  getApplicationById,
  getApplicationEntityResolutions,
  officerReviewEntityResolution,
  getAuditLogs,
} from '../src/lib/server/db.ts';
import { WorkflowRouter } from '../src/lib/server/ai/workflow-router.ts';
import { EntityResolutionEngine } from '../src/lib/server/ai/entity-resolution/index.ts';
import {
  resolveApplicationIdentity,
  getAuthorizedRegistriesForService,
} from '../src/lib/server/ai/orchestrator.ts';

function assert(condition, message) {
  if (!condition) {
    console.error('[FAIL] ASSERTION FAILED: ' + message);
    process.exit(1);
  }
  console.log('[PASS] ' + message);
}

async function main() {
  console.log('========================================================');
  console.log('   SEVA SAARTHI PHASE 6: END-TO-END INTEGRATION TEST    ');
  console.log('========================================================\n');

  const db = await getAuthoritativeDb();

  // ------------------------------------------------------------------
  // SCENARIO 1: End-to-End Post-Matric Scholarship Lifecycle
  // ------------------------------------------------------------------
  console.log('--- 1. Citizen Application Submission (Post-Matric Scholarship) ---');
  const citizenPayload = {
    userId: '00000000-0000-0000-0000-000000000001',
    applicantName: 'Ravi Kumar',
    applicantEmail: 'ravi.kumar@example.com',
    applicantPhone: '9876543210',
    serviceId: 's001', // Scholarship
    consentGranted: true,
    citizenData: {
      fullName: 'Ravi Kumar',
      dateOfBirth: '1991-04-12',
      fatherName: 'Suresh Kumar',
      address: 'H.No 12, Main St, Village Kothur',
      district: 'Rangareddy',
      state: 'Telangana',
      pincode: '509228',
      aadhaarNumber: '999911112222',
      mobile: '9876543210',
      email: 'ravi.kumar@example.com',
    },
  };

  const createdApp = await createPanApplication(citizenPayload);
  assert(Boolean(createdApp && createdApp.id), `Application created successfully: ${createdApp?.id}`);
  assert(createdApp.serviceName.includes('Scholarship'), `Service mapped to scholarship: ${createdApp.serviceName}`);

  // ------------------------------------------------------------------
  // SCENARIO 2: AI Model 1 Workflow Routing Verification
  // ------------------------------------------------------------------
  console.log('\n--- 2. AI Model 1 Workflow Routing Verification ---');
  const routingRecs = await pgQuery(
    `SELECT r.*, s.name as service_name, d.name as department_name, w.code as workflow_code
     FROM application_routing_recommendations r
     LEFT JOIN services s ON r.suggested_service_id = s.id
     LEFT JOIN departments d ON r.suggested_department_id = d.id
     LEFT JOIN workflow_definitions w ON r.suggested_workflow_id = w.id
     WHERE r.application_id = (SELECT id FROM applications WHERE application_number = $1 OR id::text = $1 LIMIT 1)
     ORDER BY r.created_at DESC LIMIT 1`,
    [createdApp.id]
  );

  assert(routingRecs.length > 0, 'Model 1 routing recommendation persisted to database');
  const rec = routingRecs[0];
  console.log('Model 1 Recommended Service:', rec.service_name);
  console.log('Model 1 Recommended Department:', rec.department_name);
  console.log('Model 1 Recommended Workflow:', rec.workflow_code);
  console.log('Model 1 Confidence Score:', rec.confidence_score);
  assert(Number(rec.confidence_score) >= 0.85, 'Model 1 confidence score >= 0.85');
  assert(rec.routing_mode === 'AI_RECOMMENDED' || rec.routing_mode === 'AI_CONFIRMED', 'Valid routing mode assigned');

  // ------------------------------------------------------------------
  // SCENARIO 3: Statutory DPDP Consent Gate
  // ------------------------------------------------------------------
  console.log('\n--- 3. Statutory DPDP Consent Verification Gate ---');
  const authorizedRegistries = getAuthorizedRegistriesForService(createdApp.serviceName);
  console.log('Authorized Registries for Scholarship Workflow:', authorizedRegistries);
  assert(
    authorizedRegistries.includes('revenue_registry') && authorizedRegistries.includes('education_registry'),
    'Scholarship workflow authorizes revenue and education registries'
  );
  assert(
    !authorizedRegistries.includes('agriculture_registry') && !authorizedRegistries.includes('land_registry'),
    'Scholarship workflow strictly isolates and excludes unrelated registries'
  );

  // Test unconsented query rejection
  let consentBlocked = false;
  try {
    await EntityResolutionEngine.matchEntity({
      name: 'Ravi Kumar',
      allowedRegistries: ['revenue_registry'],
      consentVerified: false,
    });
  } catch (err) {
    if (err.message.includes('DPDP Statutory Consent Violation')) {
      consentBlocked = true;
    }
  }
  assert(consentBlocked, 'DPDP Consent gate strictly blocks unconsented registry retrieval');

  // ------------------------------------------------------------------
  // SCENARIO 4: AI Model 2 Entity Resolution & Semantic Data Mapping
  // ------------------------------------------------------------------
  console.log('\n--- 4. AI Model 2 Entity Resolution & Semantic Data Mapping ---');
  const entityResList = await getApplicationEntityResolutions(createdApp.id);
  console.log(`Found ${entityResList.length} entity resolution records in database.`);
  assert(entityResList.length > 0, 'AI Model 2 generated and persisted candidate resolutions');

  const topCand = entityResList[0];
  console.log('Top Candidate Record:', topCand.candidate_record_id, 'Registry:', topCand.candidate_registry, 'Score:', topCand.total_score);
  assert(Number(topCand.total_score) >= 0.70, 'Top candidate has match score >= 70%');
  assert(topCand.confidence_tier === 'HIGH' || topCand.confidence_tier === 'MEDIUM', 'Valid confidence tier assigned');

  // Verify semantic data mapping into application verifications
  const appWithVerif = await getApplicationById(createdApp.id);
  assert(Boolean(appWithVerif && appWithVerif.verifications.length > 0), 'Verifications populated on application');
  const hasRevCheck = appWithVerif.verifications.some(v => v.name.includes('Revenue') || v.source.includes('Revenue'));
  console.log('Verification checks on application:', appWithVerif.verifications.map(v => `${v.name} (${v.status})`));
  assert(hasRevCheck, 'Revenue registry data successfully mapped to canonical verification check');

  // ------------------------------------------------------------------
  // SCENARIO 5: Government Officer Workspace Actions (Human Review)
  // ------------------------------------------------------------------
  console.log('\n--- 5. Government Officer Workspace Actions & Adjudication ---');
  const officerUserId = 'OFF-SCH-5001';

  // Officer accepts top candidate match
  const reviewResult = await officerReviewEntityResolution(
    createdApp.id,
    topCand.id,
    'ACCEPT',
    officerUserId,
    'Officer verified Revenue income certificate matches student criteria.'
  );
  assert(reviewResult.success === true, 'Officer successfully accepted entity resolution candidate');
  assert(reviewResult.resolution.review_status === 'ACCEPTED', 'Review status updated to ACCEPTED');

  // ------------------------------------------------------------------
  // SCENARIO 6: Homonym Collision Detection Guardrail
  // ------------------------------------------------------------------
  console.log('\n--- 6. Homonym Collision Guardrail Protection ---');
  const collisionEval = await EntityResolutionEngine.matchEntity({
    name: 'Ravi Kumar',
    dateOfBirth: '1991-04-12',
    fatherName: 'Suresh Kumar',
    address: 'H.No 12, Main St, Hyderabad',
    district: 'Hyderabad',
    allowedRegistries: ['revenue_registry'],
    consentVerified: true,
  });
  console.log('Collision query result candidates found:', collisionEval.candidates.length);
  assert(collisionEval.candidates.length > 0, 'Candidates found for collision check');
  // Check that collision flag is handled safely and never auto-approved
  for (const c of collisionEval.candidates) {
    if (c.isCollisionWarning) {
      assert(c.confidenceTier === 'AMBIGUOUS', 'Colliding candidate must be demoted to AMBIGUOUS');
    }
  }

  // ------------------------------------------------------------------
  // SCENARIO 7: Append-Only Tamper-Evident Audit Trail
  // ------------------------------------------------------------------
  console.log('\n--- 7. Append-Only Tamper-Evident Audit Trail ---');
  const logs = await getAuditLogs(createdApp.id);
  console.log(`Found ${logs.length} audit entries for application ${createdApp.id}:`);
  for (const l of logs.slice(0, 5)) {
    console.log(` - [${l.action}] by ${l.actor.role} (${l.actor.name || l.actor.id}): ${l.details || l.purpose}`);
  }
  assert(logs.length >= 3, 'Audit log captured full lifecycle (Submit, Model 1, Model 2, Officer Review)');
  const allHashed = logs.every(l => Boolean(l.tamperHash && l.tamperHash.length === 64));
  assert(allHashed, 'All audit log entries contain valid SHA-256 tamper verification hashes');

  console.log('\n========================================================');
  console.log('   ALL PHASE 6 END-TO-END INTEGRATION TESTS PASSED!     ');
  console.log('========================================================\n');

  await closeAuthoritativeDb();
}

main().catch(err => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});
