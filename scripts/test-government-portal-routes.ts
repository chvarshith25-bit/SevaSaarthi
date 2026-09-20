import http from 'http';

interface RouteTest {
  path: string;
  name: string;
  expectedStatus?: number;
  checkContent?: string;
}

const canonicalRoutes: RouteTest[] = [
  // Canonical Primary Routes
  { path: '/government/dashboard', name: 'Canonical Dashboard', checkContent: 'SARKAR SEVA' },
  { path: '/government/applications', name: 'Canonical Applications Queue', checkContent: 'Applications' },
  { path: '/government/exceptions', name: 'Canonical Exceptions & Conflicts', checkContent: 'Exceptions' },
  { path: '/government/audit', name: 'Canonical Audit Trail', checkContent: 'Audit' },
  { path: '/government/admin', name: 'Canonical Admin Hub', checkContent: 'Administration' },

  // Case Review Routes for Real Applications
  { path: '/government/applications/PAN-2026-0001', name: 'Application Detail: PAN-2026-0001' },
  { path: '/government/applications/PAN-2026-0001/review', name: 'Case Review: PAN-2026-0001 (Sai Sankeerth)', checkContent: 'PAN-2026-0001' },
  { path: '/government/applications/PAN-2026-0002', name: 'Application Detail: PAN-2026-0002' },
  { path: '/government/applications/PAN-2026-0002/review', name: 'Case Review: PAN-2026-0002 (Anjali Sharma)', checkContent: 'PAN-2026-0002' },
  { path: '/government/applications/PAN-2026-0003', name: 'Application Detail: PAN-2026-0003' },
  { path: '/government/applications/PAN-2026-0003/review', name: 'Case Review: PAN-2026-0003 (Rahul Verma)', checkContent: 'PAN-2026-0003' },
  { path: '/government/applications/PAN-2026-0004', name: 'Application Detail: PAN-2026-0004' },
  { path: '/government/applications/PAN-2026-0004/review', name: 'Case Review: PAN-2026-0004 (Priya Patel)', checkContent: 'PAN-2026-0004' },
  { path: '/government/applications/SCH-2026-2345', name: 'Application Detail: SCH-2026-2345' },
  { path: '/government/applications/SCH-2026-2345/review', name: 'Case Review: SCH-2026-2345 (Ravi Kumar)', checkContent: 'SCH-2026-2345' },

  // Clean URLs on Port 3001
  { path: '/dashboard', name: 'Clean Dashboard' },
  { path: '/applications', name: 'Clean Applications Queue' },
  { path: '/applications/PAN-2026-0003', name: 'Clean Application Detail: PAN-2026-0003' },
  { path: '/applications/PAN-2026-0003/review', name: 'Clean Case Review: PAN-2026-0003' },
  { path: '/exceptions', name: 'Clean Exceptions' },
  { path: '/audit', name: 'Clean Audit' },

  // Admin & Monitoring Tools
  { path: '/government/interoperability', name: 'Admin Interoperability' },
  { path: '/government/data-mapper', name: 'Admin Data Mapper' },
  { path: '/government/workflows', name: 'Admin Workflows' },
  { path: '/government/monitoring', name: 'Admin Monitoring' },
  { path: '/government/settings', name: 'Admin Settings' },

  // Legacy & Alias Routes
  { path: '/government', name: 'Government Root Alias' },
  { path: '/gov', name: 'Gov Root Alias' },
  { path: '/gov/queue', name: 'Gov Queue Alias' },
  { path: '/gov/workspace/PAN-2026-0003', name: 'Gov Workspace Legacy Route' },
  { path: '/gov/exceptions', name: 'Gov Exceptions Alias' },
  { path: '/gov/audit', name: 'Gov Audit Alias' },
];

async function fetchWithFollow(url: string, maxRedirects = 5, cookie?: string): Promise<{ status: number; body: string; finalUrl: string }> {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const options: http.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      headers: {
        'User-Agent': 'Route-Integrity-Checker/1.0',
        'x-gov-role': 'OFFICER',
        'x-gov-user-id': 'OFF-PAN-7042',
        'Cookie': cookie || 'FORMLY_GOV_SESSION=mock_gov_session_token; formly_gov_session=mock_gov_session_token',
      },
    };

    const req = http.get(options, (res) => {
      const setCookies = res.headers['set-cookie'];
      const newCookie = setCookies ? setCookies.map(c => c.split(';')[0]).join('; ') : cookie;

      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && maxRedirects > 0) {
        const nextUrl = new URL(res.headers.location, url).toString();
        resolve(fetchWithFollow(nextUrl, maxRedirects - 1, newCookie));
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode || 0,
          body: data,
          finalUrl: url,
        });
      });
    });

    req.on('error', (err) => {
      resolve({ status: 0, body: err.message, finalUrl: url });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ status: 408, body: 'Timeout', finalUrl: url });
    });
  });
}

async function runAudit() {
  console.log('========================================================================');
  console.log('SARKAR SEVA — GOVERNMENT PORTAL ROUTE INTEGRITY & RESOLUTION AUDIT');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  console.log('--- 1. VERIFYING SARKAR SEVA (PORT 3001) RESOLUTION ---');
  for (const route of canonicalRoutes) {
    const url = `http://localhost:3001${route.path}`;
    const res = await fetchWithFollow(url);
    
    if (res.status === 200) {
      console.log(`[PASS] ${route.name.padEnd(45)} -> HTTP 200 OK`);
      passed++;
    } else {
      console.error(`[FAIL] ${route.name.padEnd(45)} -> HTTP ${res.status} (Target: ${url})`);
      failed++;
    }
  }

  console.log('\n--- 2. VERIFYING SAFE MISSING-APPLICATION STATE ---');
  const invalidUrl = 'http://localhost:3001/government/applications/INVALID-APP-9999/review';
  const invalidRes = await fetchWithFollow(invalidUrl);
  if (invalidRes.status === 200) {
    console.log(`[PASS] Missing application ${invalidUrl} -> Handled safely with 200 OK`);
    passed++;
  } else {
    console.error(`[FAIL] Missing application returned HTTP ${invalidRes.status}`);
    failed++;
  }

  console.log('\n--- 3. VERIFYING STRICT PORT SEPARATION (PORT 3000 BLOCKS GOV ROUTES) ---');
  for (const route of canonicalRoutes.slice(0, 8)) {
    const url = `http://localhost:3000${route.path}`;
    const res = await fetchWithFollow(url);
    if (res.status === 403) {
      console.log(`[PASS] Port 3000 blocks ${route.path.padEnd(45)} -> HTTP 403 Forbidden`);
      passed++;
    } else {
      console.error(`[FAIL] Port 3000 allowed gov route ${route.path} -> HTTP ${res.status}`);
      failed++;
    }
  }

  console.log('\n========================================================================');
  console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log(`PORTAL INTEGRITY SCORE: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAudit();
