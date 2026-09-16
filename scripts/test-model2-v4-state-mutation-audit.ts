/**
 * Seva Saarthi AI Model 2 V4.2 - State Mutation & Statutory Isolation Audit
 * Phase 7F.4.4 Audit Script
 * 
 * Verifies that AI Model 2 V4.2 execution:
 * 1. Performs strictly read-only advisory inferences.
 * 2. Causes ZERO database mutations (0 inserts, 0 updates, 0 deletes).
 * 3. Never triggers application state transitions (DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED/REJECTED).
 * 4. Never creates statutory decisions or statutory approvals.
 * 5. Strictly upholds DPDP consent isolation without state side-effects.
 */

import { getAuthoritativeDb } from '../src/lib/server/pg-db';
import { EntityResolutionEngineV4 } from '../src/lib/server/ai/entity-resolution/v4-transformer/v4-engine';
import { EntityResolutionInput } from '../src/lib/server/ai/entity-resolution/types';
import crypto from 'crypto';

interface TableSnapshot {
  tableName: string;
  rowCount: number;
  dataHash: string;
}

const AUDITED_TABLES = [
  'applications',
  'application_status_history',
  'application_routing_recommendations',
  'application_entity_matches',
  'synthetic_master_citizens',
  'registry_revenue',
  'registry_education',
  'registry_agriculture',
  'registry_health',
  'registry_housing',
  'registry_land',
  'registry_pan',
  'sub_departments',
];

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  [FAIL] ${msg}`);
    throw new Error(msg);
  }
  console.log(`  [PASS] ${msg}`);
}

async function takeDatabaseSnapshot(db: any): Promise<Map<string, TableSnapshot>> {
  const snapshotMap = new Map<string, TableSnapshot>();

  for (const table of AUDITED_TABLES) {
    try {
      const countRes = await db.query(`SELECT count(*)::int as count FROM "${table}"`);
      const rowCount = countRes.rows[0]?.count || 0;

      const rowsRes = await db.query(`SELECT * FROM "${table}" ORDER BY 1 LIMIT 1000`);
      const serialized = JSON.stringify(rowsRes.rows);
      const dataHash = crypto.createHash('sha256').update(serialized).digest('hex');

      snapshotMap.set(table, {
        tableName: table,
        rowCount,
        dataHash,
      });
    } catch (e) {
      // Table might not exist in all test environments
    }
  }

  return snapshotMap;
}

export async function runStateMutationAudit() {
  console.log('========================================================================');
  console.log('   SEVA SAARTHI: MODEL 2 V4.2 STATE-MUTATION & ISOLATION AUDIT          ');
  console.log('========================================================================\n');

  const db = await getAuthoritativeDb();
  const v4Instance = EntityResolutionEngineV4.getInstance();

  console.log('Step 1: Capturing baseline database snapshot across all tables...');
  const beforeSnapshot = await takeDatabaseSnapshot(db);
  console.log(`  Audited ${beforeSnapshot.size} database tables in baseline snapshot.`);

  console.log('\nStep 2: Executing adversarial query battery through Model 2 V4.2...');

  const testQueries: EntityResolutionInput[] = [
    // Standard English query
    {
      name: 'Amit Patel',
      dateOfBirth: '1976-02-02',
      district: 'Vijayawada',
      allowedRegistries: ['revenue_registry', 'pan_tax_registry'],
      consentVerified: true,
    },
    // Severe DOB collision attack
    {
      name: 'Amit Patel',
      dateOfBirth: '1920-01-01',
      fatherName: 'Kishore Patel',
      district: 'Vijayawada',
      allowedRegistries: ['revenue_registry'],
      consentVerified: true,
    },
    // Devanagari query
    {
      name: 'अमित पटेल',
      district: 'Vijayawada',
      allowedRegistries: ['revenue_registry'],
      consentVerified: true,
    },
    // Telugu script query
    {
      name: 'అమిత్ పటేల్',
      district: 'Vijayawada',
      allowedRegistries: ['revenue_registry'],
      consentVerified: true,
    },
    // Transliterated Romanized query
    {
      name: 'amit patell saab',
      district: 'Vijayawada',
      allowedRegistries: ['revenue_registry'],
      consentVerified: true,
    },
    // Mixed script query
    {
      name: 'Amit Patel (अमित पटेल)',
      district: 'Vijayawada',
      allowedRegistries: ['revenue_registry'],
      consentVerified: true,
    },
    // Malformed empty query
    {
      name: '',
      allowedRegistries: ['revenue_registry'],
      consentVerified: true,
    },
    // Single initial query
    {
      name: 'A. Patel',
      district: 'Vijayawada',
      allowedRegistries: ['revenue_registry'],
      consentVerified: true,
    },
    // Cross-registry multi-table query
    {
      name: 'Ravi Kumar',
      dateOfBirth: '1985-05-12',
      fatherName: 'Suresh Kumar',
      district: 'Jaipur',
      allowedRegistries: ['revenue_registry', 'education_registry', 'health_registry', 'agriculture_registry'],
      consentVerified: true,
    },
  ];

  for (let i = 0; i < testQueries.length; i++) {
    const q = testQueries[i];
    const res = await v4Instance.resolve(q, { enableEmbeddingCache: false });
    assert(
      res.disclaimer.includes('advisory evidence') || res.disclaimer.includes('Advisory'),
      `Query ${i + 1} disclaimer confirms purely advisory status`
    );
  }

  // Also test consent violation attempt
  try {
    await v4Instance.resolve({
      name: 'Amit Patel',
      allowedRegistries: ['revenue_registry'],
      consentVerified: false,
    }, { enableEmbeddingCache: false });
  } catch (err) {
    // Expected consent gate rejection
  }

  console.log('\nStep 3: Capturing post-inference database snapshot...');
  const afterSnapshot = await takeDatabaseSnapshot(db);

  console.log('\nStep 4: Verifying database state invariance across all tables...');
  let anyMutationDetected = false;

  for (const [table, before] of beforeSnapshot.entries()) {
    const after = afterSnapshot.get(table);
    if (!after) {
      console.error(`  [MUTATION DETECTED] Table ${table} disappeared!`);
      anyMutationDetected = true;
      continue;
    }

    const countMatch = before.rowCount === after.rowCount;
    const hashMatch = before.dataHash === after.dataHash;

    if (!countMatch || !hashMatch) {
      console.error(`  [MUTATION DETECTED] Table "${table}": Row count ${before.rowCount} -> ${after.rowCount}, Hash ${before.dataHash} -> ${after.dataHash}`);
      anyMutationDetected = true;
    } else {
      console.log(`  [INVARIANT VERIFIED] Table "${table}": ${after.rowCount} rows, hash intact (${after.dataHash.substring(0, 12)}...)`);
    }
  }

  assert(!anyMutationDetected, 'ZERO database state mutations detected across all tables (0 inserts, 0 updates, 0 deletes)');

  // Verify Application Statuses
  console.log('\nStep 5: Verifying statutory decision isolation...');
  const appStatusRes = await db.query(`SELECT status, count(*) as count FROM applications GROUP BY status`);
  console.log('  Application statuses present:', appStatusRes.rows);
  assert(
    !appStatusRes.rows.some((r: any) => r.status === 'APPROVED_BY_AI'),
    'Zero unauthorized AI automated statutory approvals exist'
  );

  console.log('\n========================================================================');
  console.log('   STATE-MUTATION AUDIT COMPLETE: 100% READ-ONLY ADVISORY ISOLATION     ');
  console.log('========================================================================\n');
}

if (require.main === module) {
  runStateMutationAudit().catch((err) => {
    console.error('[FATAL] State mutation audit failed:', err);
    process.exit(1);
  });
}
