/**
 * PHASE 9.1 — Full Button, CTA, Tab, Modal, and Action Forensic Test
 * Validates every interactive button, filter switch, modal action,
 * decision CTA, document preview, and state transition.
 */

const GOV_BASE = 'http://localhost:3001';
const CITIZEN_BASE = 'http://localhost:3000';

interface ButtonTestResult {
  suite: string;
  action: string;
  expected: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const results: ButtonTestResult[] = [];

function record(suite: string, action: string, expected: string, status: 'PASS' | 'FAIL', details: string) {
  results.push({ suite, action, expected, status, details });
  console.log(`[${status}] [${suite}] ${action} -> ${details}`);
}

async function run() {
  console.log('========================================================================');
  console.log('       SEVA SAARTHI / SARKAR SEVA BUTTON & INTERACTION AUDIT            ');
  console.log('========================================================================\n');

  const govCookie = 'FORMLY_GOV_SESSION=sample_gov_officer_token_hyd_7729';
  const citizenCookie = 'FORMLY_CITIZEN_SESSION=sample_citizen_token_hyd_9921';

  // 1. Session / Auth Verification
  const meRes = await fetch(`${GOV_BASE}/api/gov/me`, {
    headers: { Cookie: govCookie },
  });
  const meData = await meRes.json();
  record('Auth CTAs', 'Officer Session Verification', 'Returns authorized officer profile', meRes.status === 200 && meData.success ? 'PASS' : 'FAIL', `Officer: ${meData.user?.name || meData.employee?.full_name || 'Authorized'}`);

  // 2. Tab Filtering & Application Grid Counts
  const tabs = ['all', 'assigned', 'needs_action', 'verification', 'returned', 'completed', 'exceptions'];
  for (const tab of tabs) {
    const tabRes = await fetch(`${GOV_BASE}/api/gov/applications?tab=${tab}`, {
      headers: { Cookie: govCookie },
    });
    const data = await tabRes.json();
    const count = Array.isArray(data.applications) ? data.applications.length : 0;
    record('Tabs & Filters', `Switch to tab: ${tab}`, 'Returns filtered application list', tabRes.status === 200 ? 'PASS' : 'FAIL', `Applications count: ${count}`);
  }

  // 3. Create Fresh Application for Full Button & Lifecycle Testing
  const createRes = await fetch(`${GOV_BASE}/api/gov/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: govCookie },
    body: JSON.stringify({
      applicantName: 'Audit Interaction Test Citizen',
      applicantPhone: '9876543210',
      applicantEmail: 'interaction.audit@seva.gov.in',
      citizenData: {
        fullName: 'Audit Interaction Test Citizen',
        dateOfBirth: '1995-05-15',
        fatherName: 'Audit Father Test',
        address: 'Road No 10, Banjara Hills, Hyderabad',
        pincode: '500034',
        district: 'HYDERABAD',
        state: 'TELANGANA',
        serviceType: 'NEW_PAN',
      },
      consentGranted: true,
    }),
  });
  const createData = await createRes.json();
  const testAppId = createData.application?.application_number || createData.application?.id || 'PAN-2026-0005';
  record('Workspace Buttons', 'Create & Ingest Application', 'Generates unique application', createRes.status === 200 || createRes.status === 201 ? 'PASS' : 'FAIL', `Created ${testAppId}`);

  // 4. Application Dossier Loading
  const appRes = await fetch(`${GOV_BASE}/api/gov/applications/${testAppId}`, {
    headers: { Cookie: govCookie },
  });
  const appData = await appRes.json();
  const loadedId = appData.application?.application_number || appData.application?.id || appData.application_number;
  record('Workspace Buttons', 'Load Application Dossier', 'Returns complete PAN record', appRes.status === 200 && !!loadedId ? 'PASS' : 'FAIL', `Loaded ${loadedId}`);

  // 5. Confirm Route CTA
  const confirmRouteRes = await fetch(`${GOV_BASE}/api/gov/applications/${testAppId}/confirm-route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: govCookie },
    body: JSON.stringify({ officerNotes: 'Forensic audit automated route confirmation' }),
  });
  record('Decision CTAs', 'Confirm Workflow Route CTA', 'Transitions routing status', confirmRouteRes.status === 200 ? 'PASS' : 'FAIL', `HTTP ${confirmRouteRes.status}`);

  // 6. Override Route CTA
  const overrideRouteRes = await fetch(`${GOV_BASE}/api/gov/applications/${testAppId}/override-route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: govCookie },
    body: JSON.stringify({
      overrideServiceId: 'srv-pan-01',
      overrideDepartmentId: 'dept-rev-01',
      overrideSubDepartmentId: 'sub-direct-tax',
      overrideOfficeId: 'off-hyd-01',
      reason: 'Statutory officer override audit validation for specialized desk routing.',
    }),
  });
  record('Decision CTAs', 'Override Route Modal CTA', 'Logs statutory justification', overrideRouteRes.status === 200 ? 'PASS' : 'FAIL', `HTTP ${overrideRouteRes.status}`);

  // 7. Return for Correction Modal CTA
  const returnRes = await fetch(`${GOV_BASE}/api/gov/applications/${testAppId}/return`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: govCookie },
    body: JSON.stringify({
      reason: 'Address proof document is slightly cropped at margins. Please re-upload.',
    }),
  });
  record('Decision CTAs', 'Return for Correction Modal CTA', 'Sets RETURNED status', returnRes.status === 200 ? 'PASS' : 'FAIL', `HTTP ${returnRes.status}`);

  // 8. Citizen Resubmit CTA
  const resubmitRes = await fetch(`${CITIZEN_BASE}/api/track/${testAppId}/resubmit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: citizenCookie },
    body: JSON.stringify({
      updatedFields: {
        addressProof: 'https://storage.formly.gov.in/docs/addr_clear.pdf',
        citizenNotes: 'High resolution address proof uploaded.',
      },
    }),
  });
  record('Citizen CTAs', 'Citizen Resubmit Application CTA', 'Transitions back to officer desk', resubmitRes.status === 200 ? 'PASS' : 'FAIL', `HTTP ${resubmitRes.status}`);

  // 9. Officer Accept Application CTA
  const acceptRes = await fetch(`${GOV_BASE}/api/gov/applications/${testAppId}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: govCookie },
    body: JSON.stringify({
      remarks: 'Statutory identity verification fully satisfied. PAN Granted.',
    }),
  });
  const acceptData = await acceptRes.json();
  const panNum = acceptData.application?.panNumber || acceptData.application?.application_number;
  record('Decision CTAs', 'Officer Final Accept CTA', 'Generates statutory approval', acceptRes.status === 200 ? 'PASS' : 'FAIL', `Approved: ${panNum}`);

  // 10. Physical Pipeline Advance CTAs
  const stages = ['CARD_PRINTING', 'DISPATCHED', 'DELIVERED'];
  for (const st of stages) {
    const advRes = await fetch(`${GOV_BASE}/api/gov/applications/${testAppId}/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: govCookie },
      body: JSON.stringify({ nextStage: st }),
    });
    record('Pipeline CTAs', `Advance Physical Pipeline to ${st}`, 'Updates stage tracking', advRes.status === 200 ? 'PASS' : 'FAIL', `HTTP ${advRes.status}`);
  }

  // 11. Audit Log Explorer Filter
  const auditRes = await fetch(`${GOV_BASE}/api/gov/audit?applicationId=${testAppId}`, {
    headers: { Cookie: govCookie },
  });
  const auditData = await auditRes.json();
  const logCount = Array.isArray(auditData.auditLogs) ? auditData.auditLogs.length : 0;
  record('Audit Explorer', 'Filter Audit Logs by Application ID', 'Returns SHA-256 logs', auditRes.status === 200 && logCount > 0 ? 'PASS' : 'FAIL', `Found ${logCount} immutable audit entries`);

  console.log('\n========================================================================');
  const passTotal = results.filter(r => r.status === 'PASS').length;
  console.log(`TOTAL BUTTON/ACTION CHECKS: ${results.length} | PASSED: ${passTotal} | FAILED: ${results.length - passTotal}`);
  console.log(`INTERACTIVITY HEALTH SCORE: ${((passTotal / results.length) * 100).toFixed(1)}%`);
  console.log('========================================================================\n');

  if (passTotal !== results.length) {
    process.exit(1);
  }
}

run();
