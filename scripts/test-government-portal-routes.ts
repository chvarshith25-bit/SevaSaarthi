import http from 'http';

interface RouteTest {
  path: string;
  name: string;
  expectedGovStatus?: number[];
  checkContent?: string;
}

const routesToTest: RouteTest[] = [
  // Canonical Primary Routes
  { path: '/government/dashboard', name: 'Canonical Dashboard', checkContent: 'Dashboard' },
  { path: '/government/applications', name: 'Canonical My Applications Queue', checkContent: 'Applications' },
  { path: '/government/applications/PAN-2026-0001', name: 'Canonical Application Workspace', checkContent: 'PAN-2026-0001' },
  { path: '/government/exceptions', name: 'Canonical Exceptions & Conflicts', checkContent: 'Exceptions' },
  { path: '/government/audit', name: 'Canonical Audit Trail', checkContent: 'Audit' },
  { path: '/government/admin', name: 'Canonical Admin Hub', checkContent: 'Administration' },

  // Admin Tools
  { path: '/government/admin/interoperability', name: 'Admin Interoperability', checkContent: 'Interoperability' },
  { path: '/government/admin/data-mapper', name: 'Admin Data Mapper', checkContent: 'Mapper' },
  { path: '/government/admin/workflows', name: 'Admin Workflows', checkContent: 'Workflows' },
  { path: '/government/admin/monitoring', name: 'Admin Monitoring', checkContent: 'Monitoring' },
  { path: '/government/admin/resources', name: 'Admin Resources', checkContent: 'Resources' },
  { path: '/government/admin/settings', name: 'Admin Settings', checkContent: 'Settings' },

  // Legacy & Alias Routes
  { path: '/government', name: 'Government Root Alias' },
  { path: '/government/queue', name: 'Government Queue Alias' },
  { path: '/government/my-queue', name: 'Government My-Queue Alias' },
  { path: '/gov', name: 'Gov Root Alias' },
  { path: '/gov/queue', name: 'Gov Queue Alias' },
  { path: '/gov/workspace/PAN-2026-0001', name: 'Gov Workspace Legacy Route' },
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
        ...(cookie ? { Cookie: cookie } : {}),
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
  console.log('SEVA SAARTHI - GOVERNMENT PORTAL REDESIGN ROUTE INTEGRITY & SECURITY AUDIT');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  console.log('--- 1. VERIFYING GOVERNMENT PORTAL (PORT 3001) RESOLUTION ---');
  for (const route of routesToTest) {
    const url = `http://localhost:3001${route.path}`;
    const res = await fetchWithFollow(url);
    
    // Status 200 and no 404/500
    if (res.status === 200) {
      console.log(`[PASS] ${route.name.padEnd(35)} -> HTTP 200 OK (Resolved to ${new URL(res.finalUrl).pathname})`);
      passed++;
    } else {
      console.error(`[FAIL] ${route.name.padEnd(35)} -> HTTP ${res.status} (Target: ${url})`);
      failed++;
    }
  }

  console.log('\n--- 2. VERIFYING STRICT PORT SEPARATION (PORT 3000 BLOCKS GOV ROUTES) ---');
  for (const route of routesToTest.slice(0, 6)) {
    const url = `http://localhost:3000${route.path}`;
    const res = await fetchWithFollow(url);
    // Must be 403 Forbidden or redirected away
    if (res.status === 403) {
      console.log(`[PASS] Port 3000 blocks ${route.path.padEnd(35)} -> HTTP 403 Forbidden (Security Intact)`);
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
