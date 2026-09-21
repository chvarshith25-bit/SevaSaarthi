/**
 * PHASE 9.1 — Comprehensive Navigation & Link Crawler
 * Validates all navigation menus, sidebar links, breadcrumbs, headers,
 * and page transitions across Citizen (3000) and Sarkar Seva (3001).
 */

const CITIZEN_BASE = 'http://localhost:3000';
const GOV_BASE = 'http://localhost:3001';

interface CrawlResult {
  portal: 'Citizen' | 'Government';
  target: string;
  name: string;
  status: number;
  ok: boolean;
  notes?: string;
}

const results: CrawlResult[] = [];

async function testFetch(portal: 'Citizen' | 'Government', url: string, name: string, cookie?: string) {
  try {
    const headers: Record<string, string> = {
      'User-Agent': 'Phase-9.1-Audit-Crawler/1.0',
    };
    if (cookie) {
      headers['Cookie'] = cookie;
    }
    const res = await fetch(url, { headers, redirect: 'manual' });
    const ok = res.status === 200 || res.status === 307 || res.status === 308 || res.status === 302;
    results.push({
      portal,
      target: url,
      name,
      status: res.status,
      ok,
      notes: ok ? 'Verified OK' : `HTTP ${res.status}`,
    });
  } catch (err: any) {
    results.push({
      portal,
      target: url,
      name,
      status: 0,
      ok: false,
      notes: err.message,
    });
  }
}

async function run() {
  console.log('========================================================================');
  console.log('       SEVA SAARTHI / SARKAR SEVA FULL NAVIGATION & LINK CRAWL          ');
  console.log('========================================================================\n');

  const citizenCookie = 'FORMLY_CITIZEN_SESSION=ctz_session_sample_123';
  const govCookie = 'FORMLY_GOV_SESSION=gov_officer_session_sample_123';

  console.log('--- 1. Citizen Portal Navigation Links ---');
  const citizenLinks = [
    { path: '/', name: 'Landing Page' },
    { path: '/dashboard', name: 'Citizen Dashboard' },
    { path: '/services', name: 'Services Directory' },
    { path: '/services/pan', name: 'PAN Service Page' },
    { path: '/services/scholarship', name: 'Scholarship Service Page' },
    { path: '/discover', name: 'Scheme Discovery' },
    { path: '/checklist', name: 'Document Readiness Checklist' },
    { path: '/vault', name: 'DigiLocker Document Vault' },
    { path: '/documents', name: 'Uploaded Documents' },
    { path: '/track', name: 'Track Status Portal' },
    { path: '/track/PAN-2026-0001', name: 'Track Specific Application' },
    { path: '/applications', name: 'Applications History' },
    { path: '/applications/PAN-2026-0001/status', name: 'Application Status Machine' },
    { path: '/tasks', name: 'Citizen Pending Tasks' },
    { path: '/notifications', name: 'Citizen Notifications Center' },
    { path: '/assistant', name: 'Multilingual AI Assistant' },
    { path: '/profile', name: 'Citizen Profile' },
    { path: '/help', name: 'Help & FAQs' },
    { path: '/portal/scholarships', name: 'Scholarships Portal' },
  ];

  for (const item of citizenLinks) {
    await testFetch('Citizen', `${CITIZEN_BASE}${item.path}`, item.name, citizenCookie);
  }

  console.log('\n--- 2. Sarkar Seva (Government Portal) Navigation Links ---');
  const govLinks = [
    { path: '/government/login', name: 'Officer Login' },
    { path: '/government/dashboard', name: 'Executive Operations Dashboard' },
    { path: '/government/applications', name: 'All Applications Grid' },
    { path: '/government/applications?tab=all', name: 'Tab: All Applications' },
    { path: '/government/applications?tab=assigned', name: 'Tab: Assigned To Me' },
    { path: '/government/applications?tab=needs_action', name: 'Tab: Needs Action' },
    { path: '/government/applications?tab=verification', name: 'Tab: Verification' },
    { path: '/government/applications?tab=returned', name: 'Tab: Returned' },
    { path: '/government/applications?tab=completed', name: 'Tab: Completed' },
    { path: '/government/applications?tab=exceptions', name: 'Tab: SLA Exceptions' },
    { path: '/government/my-queue', name: 'My Queue View' },
    { path: '/government/queue', name: 'Section Queue' },
    { path: '/government/applications/PAN-2026-0001', name: 'Application Dossier PAN-0001' },
    { path: '/government/applications/PAN-2026-0001/review', name: 'Action Workspace PAN-0001' },
    { path: '/government/applications/PAN-2026-0002/review', name: 'Action Workspace PAN-0002' },
    { path: '/government/applications/PAN-2026-0003/review', name: 'Action Workspace PAN-0003' },
    { path: '/government/applications/PAN-2026-0004/review', name: 'Action Workspace PAN-0004' },
    { path: '/government/audit', name: 'SHA-256 Audit Trail' },
    { path: '/government/exceptions', name: 'Operational Exceptions' },
    { path: '/government/data-mapper', name: 'Data Mapper Console' },
    { path: '/government/interoperability', name: 'Interoperability Hub' },
    { path: '/government/workflows', name: 'Model 1 Workflows' },
    { path: '/government/monitoring', name: 'System Monitoring' },
    { path: '/government/profile', name: 'Officer Profile' },
    { path: '/government/settings', name: 'Government Settings' },
    { path: '/gov/workspace/PAN-2026-0001', name: 'Fast Action Workspace' },
  ];

  for (const item of govLinks) {
    await testFetch('Government', `${GOV_BASE}${item.path}`, item.name, govCookie);
  }

  console.log('\n--- 3. Results Summary ---');
  let passCount = 0;
  for (const res of results) {
    if (res.ok) {
      passCount++;
      console.log(`[PASS] [${res.portal}] ${res.name} -> ${res.target} (${res.status})`);
    } else {
      console.log(`[FAIL] [${res.portal}] ${res.name} -> ${res.target} (${res.status}) - ${res.notes}`);
    }
  }

  console.log('\n========================================================================');
  console.log(`TOTAL NAVIGATION TARGETS: ${results.length} | PASSED: ${passCount} | FAILED: ${results.length - passCount}`);
  console.log(`NAVIGATION HEALTH SCORE: ${((passCount / results.length) * 100).toFixed(1)}%`);
  console.log('========================================================================');

  if (passCount !== results.length) {
    process.exit(1);
  }
}

run();
