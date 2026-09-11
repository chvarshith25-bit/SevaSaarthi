import fs from "fs";
import path from "path";
import { PGlite } from "@electric-sql/pglite";
import crypto from "crypto";

declare global {
  // eslint-disable-next-line no-var
  var __formly_pglite: PGlite | undefined;
  // eslint-disable-next-line no-var
  var __formly_pg_init_promise: Promise<PGlite> | undefined;
}

function cleanSqlForPglite(sql: string): string {
  return sql.replace(/create\s+extension\s+[^;]+;/gi, "-- stripped extension");
}

export async function getAuthoritativeDb(): Promise<PGlite> {
  if (globalThis.__formly_pglite) {
    try {
      await globalThis.__formly_pglite.query(`SELECT 1`);
      return globalThis.__formly_pglite;
    } catch {
      try { await globalThis.__formly_pglite.close(); } catch {}
      globalThis.__formly_pglite = undefined;
      globalThis.__formly_pg_init_promise = undefined;
    }
  }

  if (globalThis.__formly_pg_init_promise) {
    return globalThis.__formly_pg_init_promise;
  }

  globalThis.__formly_pg_init_promise = (async () => {
    // We use a dedicated directory in data/formly_pg
    const dataDir = path.resolve(process.cwd(), "data", "formly_pg");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Clean any stale postmaster.pid from aborted runs
    const pidFile = path.join(dataDir, "postmaster.pid");
    if (fs.existsSync(pidFile)) {
      try {
        fs.unlinkSync(pidFile);
      } catch {
        // ignore
      }
    }

    let db: PGlite;
    // On Windows, PGlite's WASM Emscripten VFS has known concurrency/locking limitations with NTFS paths.
    // Defaulting to in-memory PGlite on Windows guarantees instant (<50ms) startup, zero lock contention,
    // and complete immunity from "unexpected data beyond EOF" block corruption.
    const preferMemory = process.env.FORMLY_PG_MEMORY === "true" || process.platform === "win32";
    if (preferMemory) {
      db = new PGlite();
      await db.waitReady;
    } else {
      try {
        db = new PGlite(dataDir);
        await db.waitReady;
        await db.query(`SELECT 1`);
      } catch (e) {
        console.warn("[PGlite] Directory storage error, falling back to in-memory database:", e);
        db = new PGlite();
        await db.waitReady;
      }
    }

    await initSchema(db);
    globalThis.__formly_pglite = db;
    return db;
  })();

  return globalThis.__formly_pg_init_promise;
}

export async function resetAuthoritativeDb(): Promise<void> {
  if (globalThis.__formly_pglite) {
    try {
      await globalThis.__formly_pglite.close();
    } catch {}
    globalThis.__formly_pglite = undefined;
  }
  globalThis.__formly_pg_init_promise = undefined;

  const dataDir = path.resolve(process.cwd(), "data", "formly_pg");
  try {
    fs.rmSync(dataDir, { recursive: true, force: true });
    fs.mkdirSync(dataDir, { recursive: true });
  } catch {}
}

async function initSchema(db: PGlite) {
  // Check if applications table exists and is readable
  try {
    const check = await db.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'applications'`);
    if (check.rows.length > 0) {
      // Test read on users table to verify relation integrity
      await db.query(`SELECT id FROM users LIMIT 1`);
      await db.query(`UPDATE employees SET is_active = true WHERE employee_code = 'OFF-PAN-7042'`).catch(() => {});
      await seedInitialData(db);
      return; // Already initialized and healthy
    }
  } catch (err) {
    console.warn("[PGlite] Existing tables corrupted, rebuilding schema:", err);
  }

  // 1. Supabase auth mock & public users/sessions tables
  await db.exec(`
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text,
      created_at timestamptz DEFAULT now()
    );
    CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
      SELECT '00000000-0000-0000-0000-000000000001'::uuid;
    $$ LANGUAGE sql STABLE;

    CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY,
      name text NOT NULL,
      email text UNIQUE NOT NULL,
      phone text,
      "passwordHash" text NOT NULL,
      salt text NOT NULL,
      role text NOT NULL,
      "createdAt" timestamptz DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token text PRIMARY KEY,
      "userId" text REFERENCES users(id) ON DELETE CASCADE,
      "expiresAt" timestamptz NOT NULL
    );
  `);

  // 2. Migration 001
  const sql001Path = path.resolve(process.cwd(), "supabase/migrations/001_formly_schema.sql");
  if (fs.existsSync(sql001Path)) {
    const sql001 = fs.readFileSync(sql001Path, "utf8");
    await db.exec(cleanSqlForPglite(sql001));
  }

  // 3. Seed V1
  const seedPath = path.resolve(process.cwd(), "supabase/seed.sql");
  if (fs.existsSync(seedPath)) {
    const sqlSeed = fs.readFileSync(seedPath, "utf8");
    await db.exec(cleanSqlForPglite(sqlSeed));
  }

  // 4. Migration 002 (Unified 42 tables + State Machine)
  const sql002Path = path.resolve(process.cwd(), "supabase/migrations/002_formly_v2_unified_schema.sql");
  if (fs.existsSync(sql002Path)) {
    const sql002 = fs.readFileSync(sql002Path, "utf8");
    await db.exec(cleanSqlForPglite(sql002));
  }

  // 5. Seed initial employees & users for government & citizen
  await seedInitialData(db);
}

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 100000, 64, "sha512").toString("hex");
  return { hash, salt: generatedSalt };
}

async function seedInitialData(db: PGlite) {
  // Seed Citizen User
  const citizenPass = hashPassword("1234567890", "c5bfec7eff377db9d79f52e5ba7ccde0");
  await db.query(`
    INSERT INTO auth.users (id, email)
    VALUES ('00000000-0000-0000-0000-000000000001', 'sankeerths615@gmail.com')
    ON CONFLICT (id) DO NOTHING;
  `);

  await db.query(`
    INSERT INTO users (id, name, email, phone, "passwordHash", salt, role)
    VALUES (
      'u_0bc5a3b6-f059-4ab2-9870-46a9c25178b7',
      'Sai Sankeerth',
      'sankeerths615@gmail.com',
      '1234567890',
      $1,
      $2,
      'Applicant / Citizen'
    )
    ON CONFLICT (id) DO UPDATE SET
      "passwordHash" = EXCLUDED."passwordHash",
      salt = EXCLUDED.salt;
  `, [citizenPass.hash, citizenPass.salt]);

  // Seed Government Employees & Auth Users
  const govPass = hashPassword("govsecure2026", "a1b2c3d4e5f60718293a4b5c6d7e8f90");

  // Officer
  await db.query(`
    INSERT INTO auth.users (id, email)
    VALUES ('00000000-0000-0000-0000-000000007042', 'sai.sankeerth@incometax.gov.in')
    ON CONFLICT (id) DO NOTHING;
  `);
  await db.query(`
    INSERT INTO users (id, name, email, phone, "passwordHash", salt, role)
    VALUES (
      'u_officer_pan_7042',
      'Sai Sankeerth',
      'sai.sankeerth@incometax.gov.in',
      '9876543210',
      $1,
      $2,
      'Department Officer'
    )
    ON CONFLICT (id) DO NOTHING;
  `, [govPass.hash, govPass.salt]);

  await db.query(`
    INSERT INTO employees (
      id, auth_user_id, department_id, office_id, employee_code, full_name, email, role, is_active
    )
    VALUES (
      'e0000000-0000-0000-0000-000000007042',
      '00000000-0000-0000-0000-000000007042',
      'd0000000-0000-0000-0000-000000000001',
      'e0000000-0000-0000-0000-000000000002',
      'OFF-PAN-7042',
      'Sai Sankeerth',
      'sai.sankeerth@incometax.gov.in',
      'DEPARTMENT_OFFICER',
      true
    )
    ON CONFLICT (employee_code) DO NOTHING;
  `);

  // Officer Sai Sankeerth (sankeerthvss@gmail.com)
  const sankeerthPass = hashPassword("1234567890", "sankeerth_gov_salt_2026");
  await db.query(`
    INSERT INTO auth.users (id, email)
    VALUES ('00000000-0000-0000-0000-000000007043', 'sankeerthvss@gmail.com')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  `);
  await db.query(`
    INSERT INTO users (id, name, email, phone, "passwordHash", salt, role)
    VALUES (
      'u_sankeerthvss_gov',
      'Officer Sai Sankeerth',
      'sankeerthvss@gmail.com',
      '1234567890',
      $1,
      $2,
      'Department Officer'
    )
    ON CONFLICT (id) DO UPDATE SET
      "passwordHash" = EXCLUDED."passwordHash",
      salt = EXCLUDED.salt,
      role = EXCLUDED.role;
  `, [sankeerthPass.hash, sankeerthPass.salt]);

  await db.query(`
    INSERT INTO employees (
      id, auth_user_id, department_id, office_id, employee_code, full_name, email, role, is_active
    )
    VALUES (
      'e0000000-0000-0000-0000-000000007043',
      '00000000-0000-0000-0000-000000007043',
      'd0000000-0000-0000-0000-000000000001',
      'e0000000-0000-0000-0000-000000000002',
      'OFF-SAN-7043',
      'Officer Sai Sankeerth',
      'sankeerthvss@gmail.com',
      'DEPARTMENT_OFFICER',
      true
    )
    ON CONFLICT (employee_code) DO UPDATE SET
      is_active = true,
      email = EXCLUDED.email,
      role = EXCLUDED.role;
  `);

  // Dept Admin
  await db.query(`
    INSERT INTO auth.users (id, email)
    VALUES ('00000000-0000-0000-0000-000000001001', 'rajesh.sharma@incometax.gov.in')
    ON CONFLICT (id) DO NOTHING;
  `);
  await db.query(`
    INSERT INTO users (id, name, email, phone, "passwordHash", salt, role)
    VALUES (
      'u_admin_pan_1001',
      'Rajesh Sharma',
      'rajesh.sharma@incometax.gov.in',
      '9876543211',
      $1,
      $2,
      'Department Administrator'
    )
    ON CONFLICT (id) DO NOTHING;
  `, [govPass.hash, govPass.salt]);

  await db.query(`
    INSERT INTO employees (
      id, auth_user_id, department_id, office_id, employee_code, full_name, email, role, is_active
    )
    VALUES (
      'e0000000-0000-0000-0000-000000001001',
      '00000000-0000-0000-0000-000000001001',
      'd0000000-0000-0000-0000-000000000001',
      'e0000000-0000-0000-0000-000000000001',
      'ADM-PAN-1001',
      'Rajesh Sharma',
      'rajesh.sharma@incometax.gov.in',
      'DEPARTMENT_ADMIN',
      true
    )
    ON CONFLICT (employee_code) DO NOTHING;
  `);

  // Sys Admin
  await db.query(`
    INSERT INTO auth.users (id, email)
    VALUES ('00000000-0000-0000-0000-000000000099', 'vikram.rao@negd.gov.in')
    ON CONFLICT (id) DO NOTHING;
  `);
  await db.query(`
    INSERT INTO users (id, name, email, phone, "passwordHash", salt, role)
    VALUES (
      'u_sysadmin_negd_0099',
      'Vikram Rao',
      'vikram.rao@negd.gov.in',
      '9876543212',
      $1,
      $2,
      'System Administrator'
    )
    ON CONFLICT (id) DO NOTHING;
  `, [govPass.hash, govPass.salt]);

  await db.query(`
    INSERT INTO employees (
      id, auth_user_id, department_id, office_id, employee_code, full_name, email, role, is_active
    )
    VALUES (
      'e0000000-0000-0000-0000-000000000099',
      '00000000-0000-0000-0000-000000000099',
      'd0000000-0000-0000-0000-000000000002',
      null,
      'SYS-ROOT-0099',
      'Vikram Rao',
      'vikram.rao@negd.gov.in',
      'SYSTEM_ADMIN',
      true
    )
    ON CONFLICT (employee_code) DO NOTHING;
  `);

  await db.query(`
    INSERT INTO offices (id, department_id, code, name, city, state, pincode, is_active)
    VALUES (
      'e0000000-0000-0000-0000-000000000003',
      'd0000000-0000-0000-0000-000000000002',
      'OFC_NSP_DELHI',
      'National Scholarship Cell, New Delhi',
      'New Delhi',
      'Delhi',
      '110001',
      true
    )
    ON CONFLICT (department_id, code) DO NOTHING;
  `);

  await db.query(`
    INSERT INTO services (id, code, name, description, provider_name, provider_level, version, is_active)
    VALUES (
      'a0000000-0000-0000-0000-000000000001',
      'SCHOLARSHIP_01',
      'Post-Matric Scholarship Scheme (NSP)',
      'Centrally sponsored scholarship covering college tuition and study maintenance for higher education.',
      'Department of Higher Education',
      'CENTRAL',
      1,
      true
    )
    ON CONFLICT (code) DO NOTHING;
  `);

  // Seed Test Citizen: test.citizen@formly.local
  const testCitizenPass = hashPassword("Citizen@2026", "salt_test_citizen_2026");
  await db.query(`
    INSERT INTO auth.users (id, email)
    VALUES ('00000000-0000-0000-0000-000000000002', 'test.citizen@formly.local')
    ON CONFLICT (id) DO NOTHING;
  `);
  await db.query(`
    INSERT INTO users (id, name, email, phone, "passwordHash", salt, role)
    VALUES (
      'u_test_citizen_001',
      'Test Citizen',
      'test.citizen@formly.local',
      '9876543210',
      $1,
      $2,
      'Applicant / Citizen'
    )
    ON CONFLICT (id) DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", salt = EXCLUDED.salt;
  `, [testCitizenPass.hash, testCitizenPass.salt]);

  // Seed Test Officer: test.officer@formly.gov.local
  const testOfficerPass = hashPassword("GovOfficer@2026", "salt_test_officer_2026");
  await db.query(`
    INSERT INTO auth.users (id, email)
    VALUES ('00000000-0000-0000-0000-000000005001', 'test.officer@formly.gov.local')
    ON CONFLICT (id) DO NOTHING;
  `);
  await db.query(`
    INSERT INTO users (id, name, email, phone, "passwordHash", salt, role)
    VALUES (
      'u_test_officer_5001',
      'Test Officer',
      'test.officer@formly.gov.local',
      '9876543210',
      $1,
      $2,
      'Department Officer'
    )
    ON CONFLICT (id) DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", salt = EXCLUDED.salt;
  `, [testOfficerPass.hash, testOfficerPass.salt]);

  await db.query(`
    INSERT INTO employees (
      id, auth_user_id, department_id, office_id, employee_code, full_name, email, role, is_active
    )
    VALUES (
      'e0000000-0000-0000-0000-000000005001',
      '00000000-0000-0000-0000-000000005001',
      'd0000000-0000-0000-0000-000000000002',
      'e0000000-0000-0000-0000-000000000003',
      'OFF-SCH-5001',
      'Test Officer',
      'test.officer@formly.gov.local',
      'DEPARTMENT_OFFICER',
      true
    )
    ON CONFLICT (employee_code) DO UPDATE SET
      is_active = true,
      email = EXCLUDED.email,
      role = EXCLUDED.role;
  `);

  // Seed default session tokens for instant demo access
  await db.query(`
    INSERT INTO sessions (token, "userId", "expiresAt")
    VALUES 
      ('demo_citizen_token_sankeerth', 'u_0bc5a3b6-f059-4ab2-9870-46a9c25178b7', NOW() + INTERVAL '30 days'),
      ('demo_officer_token_7042', 'u_officer_pan_7042', NOW() + INTERVAL '8 hours'),
      ('demo_admin_token_1001', 'u_admin_pan_1001', NOW() + INTERVAL '8 hours'),
      ('demo_sysadmin_token_0099', 'u_sysadmin_negd_0099', NOW() + INTERVAL '8 hours'),
      ('test_formly_gov_session_7042', 'u_officer_pan_7042', NOW() + INTERVAL '1 day'),
      ('test_formly_citizen_session_001', 'u_0bc5a3b6-f059-4ab2-9870-46a9c25178b7', NOW() + INTERVAL '1 day'),
      ('test_formly_gov_session_5001', 'u_test_officer_5001', NOW() + INTERVAL '1 day'),
      ('test_formly_citizen_session_5001', 'u_test_citizen_001', NOW() + INTERVAL '1 day')
    ON CONFLICT (token) DO UPDATE SET "userId" = EXCLUDED."userId", "expiresAt" = EXCLUDED."expiresAt";
  `);

  // Seed sample documents for citizen vault
  await db.query(`
    INSERT INTO documents (id, user_id, document_type, storage_path, original_filename, mime_type, sha256_hash, status)
    VALUES 
      ('d0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'AADHAAR', '/vault/aadhaar.pdf', 'Aadhaar_Card_Verified.pdf', 'application/pdf', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'VERIFIED'),
      ('d0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'INCOME_CERTIFICATE', '/vault/income.pdf', 'Income_Certificate_2025_26.pdf', 'application/pdf', 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb', 'VERIFIED'),
      ('d0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'MARKSHEET', '/vault/marksheet.pdf', 'Class_10_Matriculation_Memo.pdf', 'application/pdf', '3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d', 'VERIFIED'),
      ('d0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'CASTE_CERTIFICATE', '/vault/caste.pdf', 'OBC_Community_Certificate.pdf', 'application/pdf', '2e7d2c03a9507ae265ecf5b5356885a53393a2029d241394997265a1a25aefc6', 'VERIFIED')
    ON CONFLICT (id) DO NOTHING;
  `);
}

export async function pgQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  let db = await getAuthoritativeDb();
  try {
    const res = await db.query(sql, params);
    return res.rows as T[];
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (
      msg.includes("unexpected data beyond EOF") ||
      msg.includes("Aborted()") ||
      msg.includes("could not read block") ||
      msg.includes("relation") ||
      msg.includes("corrupt")
    ) {
      console.error("[PGlite] Database corruption detected during pgQuery, automatically self-healing:", err);
      await resetAuthoritativeDb();
      db = await getAuthoritativeDb();
      const res = await db.query(sql, params);
      return res.rows as T[];
    }
    throw err;
  }
}

export async function pgExec(sql: string): Promise<void> {
  let db = await getAuthoritativeDb();
  try {
    await db.exec(sql);
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (
      msg.includes("unexpected data beyond EOF") ||
      msg.includes("Aborted()") ||
      msg.includes("could not read block") ||
      msg.includes("relation") ||
      msg.includes("corrupt")
    ) {
      console.error("[PGlite] Database corruption detected during pgExec, automatically self-healing:", err);
      await resetAuthoritativeDb();
      db = await getAuthoritativeDb();
      await db.exec(sql);
      return;
    }
    throw err;
  }
}

export async function pgTransitionApplicationStatus(
  applicationId: string,
  toStatus: string,
  actorType: "CITIZEN" | "EMPLOYEE" | "SYSTEM" | "AI",
  actorId?: string,
  reason?: string
): Promise<string> {
  const db = await getAuthoritativeDb();
  let appUuid = applicationId;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(applicationId);
  if (!isUuid) {
    const row = await db.query(`SELECT id FROM applications WHERE application_number = $1`, [applicationId]);
    if (row.rows.length > 0) {
      appUuid = (row.rows[0] as any).id;
    } else {
      return toStatus;
    }
  }

  let actorUuid = actorId;
  const isActorUuid = actorId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actorId);
  if (!isActorUuid) {
    if (actorType === "EMPLOYEE") {
      const emp = await db.query(`SELECT auth_user_id FROM employees WHERE employee_code = $1`, [actorId || 'OFF-PAN-7042']);
      actorUuid = (emp.rows[0] as any)?.auth_user_id || "00000000-0000-0000-0000-000000007042";
    } else if (actorType === "CITIZEN") {
      actorUuid = "00000000-0000-0000-0000-000000000002";
    } else {
      actorUuid = "00000000-0000-0000-0000-000000000001";
    }
  }

  const res = await db.query(
    `SELECT transition_application_status($1::uuid, $2, $3, $4::uuid, $5) as status`,
    [appUuid, toStatus, actorType, actorUuid, reason || "State transition"]
  );
  return (res.rows[0] as any)?.status as string;
}

function isValidUuid(val?: string | null): boolean {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

export async function resolveApplicationUuid(applicationId?: string | null): Promise<string | null> {
  if (!applicationId) return null;
  if (isValidUuid(applicationId)) return applicationId;
  try {
    const db = await getAuthoritativeDb();
    const row = await db.query(`SELECT id FROM applications WHERE application_number = $1`, [applicationId]);
    if (row.rows.length > 0) return (row.rows[0] as any).id;
  } catch {}
  return null;
}

export async function resolveActorUuid(actorType: string, actorId?: string | null): Promise<string> {
  if (!actorId) return "00000000-0000-0000-0000-000000000001";
  if (isValidUuid(actorId)) return actorId;
  try {
    const db = await getAuthoritativeDb();
    if (actorType === "EMPLOYEE") {
      const emp = await db.query(`SELECT auth_user_id FROM employees WHERE employee_code = $1 OR email = $1`, [actorId]);
      if (emp.rows.length > 0 && isValidUuid((emp.rows[0] as any).auth_user_id)) return (emp.rows[0] as any).auth_user_id;
    } else {
      const u = await db.query(`
        SELECT au.id 
        FROM auth.users au 
        LEFT JOIN users u ON lower(au.email) = lower(u.email)
        WHERE u.id = $1 OR au.email = $1 OR au.id::text = $1 
        LIMIT 1`,
        [actorId]
      );
      if (u.rows.length > 0 && isValidUuid((u.rows[0] as any).id)) {
        return (u.rows[0] as any).id;
      }
    }
  } catch {}
  return "00000000-0000-0000-0000-000000000001";
}

export async function pgRecordAuditEvent(
  actorType: "CITIZEN" | "EMPLOYEE" | "SYSTEM" | "AI",
  actorId: string,
  action: string,
  applicationId?: string,
  source?: string,
  target?: string,
  purpose?: string,
  consentId?: string | null,
  result?: string,
  metadata?: any
): Promise<string> {
  const db = await getAuthoritativeDb();
  const actorUuid = await resolveActorUuid(actorType, actorId);
  const appUuid = await resolveApplicationUuid(applicationId);
  const consentUuid = isValidUuid(consentId) ? consentId : null;
  const res = await db.query(
    `SELECT record_audit_event($1, $2::uuid, $3, $4::uuid, $5, $6, $7, $8::uuid, $9, $10) as id`,
    [
      actorType,
      actorUuid,
      action,
      appUuid,
      source || "GOV_PORTAL",
      target || "SYSTEM",
      purpose || action,
      consentUuid,
      result || "SUCCESS",
      metadata ? JSON.stringify(metadata) : null,
    ]
  );
  return (res.rows[0] as any)?.id as string;
}

export async function closeAuthoritativeDb(): Promise<void> {
  if (globalThis.__formly_pglite) {
    try {
      await globalThis.__formly_pglite.close();
    } catch {
      // ignore
    }
    globalThis.__formly_pglite = undefined;
    globalThis.__formly_pg_init_promise = undefined;
  }
}
