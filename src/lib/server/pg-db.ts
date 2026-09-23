import fs from "fs";
import path from "path";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import crypto from "crypto";

declare global {
  // eslint-disable-next-line no-var
  var __formly_pg_pool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __formly_pglite: PGlite | undefined;
  // eslint-disable-next-line no-var
  var __formly_pg_init_promise: Promise<PGlite | Pool> | undefined;
}

function cleanSqlForPglite(sql: string): string {
  return sql.replace(/create\s+extension\s+[^;]+;/gi, "-- stripped extension");
}

export function isProductionDatabase(): boolean {
  return process.env.DATABASE_MODE === "production" || !!process.env.DATABASE_URL;
}

export function getPostgresPool(): Pool {
  if (process.env.DATABASE_MODE === "production" && !process.env.DATABASE_URL) {
    throw new Error(
      "[Database Security] DATABASE_MODE=production requires a valid DATABASE_URL (Supabase connection pooler). Ephemeral PGlite/in-memory storage is strictly prohibited in production."
    );
  }

  if (!globalThis.__formly_pg_pool && process.env.DATABASE_URL) {
    const isLocalhost =
      process.env.DATABASE_URL.includes("localhost") ||
      process.env.DATABASE_URL.includes("127.0.0.1");
    globalThis.__formly_pg_pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
    });
  }
  return globalThis.__formly_pg_pool!;
}

export async function getAuthoritativeDb(): Promise<PGlite | Pool> {
  if (process.env.DATABASE_MODE === "production") {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "[Database Security] DATABASE_MODE=production requires a valid DATABASE_URL (Supabase connection pooler). Ephemeral PGlite/in-memory storage is strictly prohibited in production."
      );
    }
    return getPostgresPool();
  }

  if (process.env.DATABASE_URL) {
    return getPostgresPool();
  }

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
  // Check if applications, sub_departments, application_routing_recommendations, and synthetic_master_citizens tables exist
  try {
    const checkApp = await db.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'applications'`);
    const checkSub = await db.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'sub_departments'`);
    const checkRec = await db.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'application_routing_recommendations'`);
    const checkSyn = await db.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'synthetic_master_citizens'`);
    const checkEnt = await db.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'application_entity_resolutions'`);
    if (checkApp.rows.length > 0 && checkSub.rows.length > 0 && checkRec.rows.length > 0 && checkSyn.rows.length > 0 && checkEnt.rows.length > 0) {
      // Test read on users table to verify relation integrity
      await db.query(`SELECT id FROM users LIMIT 1`);
      await db.query(`UPDATE employees SET is_active = true WHERE employee_code = 'OFF-PAN-7042'`).catch(() => {});
      // Ensure router_shadow_log and model2_shadow_log tables exist (Phase 7D.2 / Phase 7E.2)
      await db.exec(`
        CREATE TABLE IF NOT EXISTS router_shadow_log (
          id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          request_id        text NOT NULL,
          user_id           text,
          v1_service_id     uuid,
          v1_confidence    numeric(5,3) NOT NULL,
          v2_service_id     uuid,
          v2_probability   numeric(5,3) NOT NULL,
          v2_tier          text NOT NULL CHECK (v2_tier IN ('AUTOMATIC_RECOMMENDATION','HUMAN_CONFIRMATION_REQUIRED','MANUAL_REVIEW')),
          ood_flag          boolean NOT NULL,
          agreement         boolean NOT NULL,
          recommendation_diff text,
          v1_version        text NOT NULL,
          v2_version        text NOT NULL,
          created_at        timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_router_shadow_req ON router_shadow_log(request_id);
        CREATE INDEX IF NOT EXISTS idx_router_shadow_created ON router_shadow_log(created_at);

        CREATE TABLE IF NOT EXISTS model2_shadow_log (
          id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          request_id              text NOT NULL,
          created_at              timestamptz NOT NULL DEFAULT now(),
          v1_model_version        text NOT NULL,
          v2_model_version        text NOT NULL,
          v1_top_candidate_id     text,
          v1_confidence           numeric(5,4),
          v1_tier                 text,
          v2_top_candidate_id     text,
          v2_probability          numeric(5,4),
          v2_tier                 text,
          is_ambiguous            boolean NOT NULL DEFAULT false,
          collision_warning       boolean NOT NULL DEFAULT false,
          agreement               boolean NOT NULL,
          disagreement_category   text,
          fallback_used           boolean NOT NULL DEFAULT false,
          v1_latency_ms           numeric(8,2) NOT NULL DEFAULT 0.0,
          v2_latency_ms           numeric(8,2) NOT NULL DEFAULT 0.0
        );
        CREATE INDEX IF NOT EXISTS idx_model2_shadow_req ON model2_shadow_log(request_id);
        CREATE INDEX IF NOT EXISTS idx_model2_shadow_agreement ON model2_shadow_log(agreement);
        CREATE INDEX IF NOT EXISTS idx_model2_shadow_created ON model2_shadow_log(created_at);
      `);
      return; // Already initialized and healthy
    }

  } catch (err) {
    console.warn("[PGlite] Existing tables need migration/rebuilding:", err);
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

  // 4b. Migration 003 (Controlled Service & Workflow Registry)
  const sql003Path = path.resolve(process.cwd(), "supabase/migrations/003_controlled_registry.sql");
  if (fs.existsSync(sql003Path)) {
    const sql003 = fs.readFileSync(sql003Path, "utf8");
    await db.exec(cleanSqlForPglite(sql003));
  }

  // 4c. Migration 004 (AI Model 1 Workflow Routing Recommendations)
  const sql004Path = path.resolve(process.cwd(), "supabase/migrations/004_ai_workflow_router.sql");
  if (fs.existsSync(sql004Path)) {
    const sql004 = fs.readFileSync(sql004Path, "utf8");
    await db.exec(cleanSqlForPglite(sql004));
  }

  // 4d. Migration 005 (Synthetic Government Registries for Model 2)
  const sql005Path = path.resolve(process.cwd(), "supabase/migrations/005_synthetic_government_registries.sql");
  if (fs.existsSync(sql005Path)) {
    const sql005 = fs.readFileSync(sql005Path, "utf8");
    await db.exec(cleanSqlForPglite(sql005));
  }

  // 4e. Migration 006 (AI Model 2 Entity Resolution Storage)
  const sql006Path = path.resolve(process.cwd(), "supabase/migrations/006_ai_entity_resolution.sql");
  if (fs.existsSync(sql006Path)) {
    const sql006 = fs.readFileSync(sql006Path, "utf8");
    await db.exec(cleanSqlForPglite(sql006));
  }

  // 5. Seed initial employees & users for government & citizen
  await seedInitialData(db);

  // Apply router_shadow_log migration (Phase 7D2)
  const shadowLogPath = path.resolve(process.cwd(), "supabase/migrations/20240915_create_router_shadow_log.sql");
  if (fs.existsSync(shadowLogPath)) {
    const shadowSql = fs.readFileSync(shadowLogPath, "utf8");
    await db.exec(cleanSqlForPglite(shadowSql));
  }

  // Apply model2_shadow_log migration (Phase 7E.2)
  const model2ShadowLogPath = path.resolve(process.cwd(), "supabase/migrations/20240915_create_model2_shadow_log.sql");
  if (fs.existsSync(model2ShadowLogPath)) {
    const model2ShadowSql = fs.readFileSync(model2ShadowLogPath, "utf8");
    await db.exec(cleanSqlForPglite(model2ShadowSql));
  }
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

  // Seed Chiluveri Varshith User
  await db.query(`
    INSERT INTO auth.users (id, email)
    VALUES ('00000000-0000-0000-0000-000000000002', 'chiluverivarshithsahs@gmail.com')
    ON CONFLICT (id) DO NOTHING;
  `);

  await db.query(`
    INSERT INTO users (id, name, email, phone, "passwordHash", salt, role)
    VALUES (
      'u_chiluveri_varshith_002',
      'Chiluveri Varshith',
      'chiluverivarshithsahs@gmail.com',
      '9876543210',
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
      'POST_MATRIC_SCHOLARSHIP',
      'Post-Matric Scholarship Scheme (NSP)',
      'Centrally sponsored scholarship covering college tuition and study maintenance for higher education.',
      'Department of Higher Education',
      'CENTRAL',
      1,
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      code = EXCLUDED.code,
      name = EXCLUDED.name,
      description = EXCLUDED.description;
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
      ('d0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'CASTE_CERTIFICATE', '/vault/caste.pdf', 'OBC_Community_Certificate.pdf', 'application/pdf', '2e7d2c03a9507ae265ecf5b5356885a53393a2029d241394997265a1a25aefc6', 'VERIFIED'),
      ('d0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'COLLEGE_ID', '/vault/college_id.pdf', 'College_ID_Card.pdf', 'application/pdf', '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b', 'VERIFIED'),
      ('d0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000002', 'AADHAAR', '/vault/aadhaar_varshith.pdf', 'Aadhaar_Card_Varshith.pdf', 'application/pdf', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'VERIFIED'),
      ('d0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000002', 'INCOME_CERTIFICATE', '/vault/income_varshith.pdf', 'Income_Certificate_2025_26.pdf', 'application/pdf', 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb', 'VERIFIED'),
      ('d0000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000002', 'COLLEGE_ID', '/vault/college_id_varshith.pdf', 'College_ID_VJIT.pdf', 'application/pdf', '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b', 'VERIFIED'),
      ('d0000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000002', 'MARKSHEET', '/vault/marksheet_varshith.pdf', 'Class_10_Matriculation_Memo.pdf', 'application/pdf', '3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d', 'VERIFIED')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Auto-seed synthetic government registries for Phase 4 if data file exists and master citizens is empty
  const synthPath = path.resolve(process.cwd(), "data/synthetic/all_registries.json");
  if (fs.existsSync(synthPath)) {
    try {
      const countRes = await db.query("SELECT COUNT(*) as count FROM synthetic_master_citizens");
      if (parseInt((countRes.rows[0] as any)?.count || "0", 10) === 0) {
        const synthData = JSON.parse(fs.readFileSync(synthPath, "utf8"));
        for (const c of synthData.citizens || []) {
          await db.query(
            `INSERT INTO synthetic_master_citizens (
              citizen_id, full_name, date_of_birth, gender, father_name, guardian_name,
              mobile_number, email, address, district, state, pincode, aadhaar_reference, pan_reference
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (citizen_id) DO NOTHING;`,
            [
              c.citizen_id, c.full_name, c.date_of_birth, c.gender, c.father_name, c.guardian_name,
              c.mobile_number, c.email, c.address, c.district, c.state, c.pincode, c.aadhaar_reference, c.pan_reference
            ]
          );
        }
        for (const r of synthData.revenue || []) {
          await db.query(
            `INSERT INTO registry_revenue (
              id, citizen_id, name, father_name, dob, address, district,
              income_certificate_number, annual_income, certificate_status, issue_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (id) DO NOTHING;`,
            [
              r.id, r.citizen_id, r.name, r.father_name, r.dob, r.address, r.district,
              r.income_certificate_number, r.annual_income, r.certificate_status, r.issue_date
            ]
          );
        }
        for (const e of synthData.education || []) {
          await db.query(
            `INSERT INTO registry_education (
              id, citizen_id, student_name, dob, college_name, course,
              scholarship_id, scholarship_status, academic_year, income_reference
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (id) DO NOTHING;`,
            [
              e.id, e.citizen_id, e.student_name, e.dob, e.college_name, e.course,
              e.scholarship_id, e.scholarship_status, e.academic_year, e.income_reference
            ]
          );
        }
        for (const a of synthData.agriculture || []) {
          await db.query(
            `INSERT INTO registry_agriculture (
              id, citizen_id, farmer_name, village, district, land_reference,
              pm_kisan_status, bank_reference, eligibility_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO NOTHING;`,
            [
              a.id, a.citizen_id, a.farmer_name, a.village, a.district, a.land_reference,
              a.pm_kisan_status, a.bank_reference, a.eligibility_status
            ]
          );
        }
        for (const h of synthData.health || []) {
          await db.query(
            `INSERT INTO registry_health (
              id, citizen_id, beneficiary_name, dob, health_scheme_id,
              ayushman_status, family_reference, eligibility_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO NOTHING;`,
            [
              h.id, h.citizen_id, h.beneficiary_name, h.dob, h.health_scheme_id,
              h.ayushman_status, h.family_reference, h.eligibility_status
            ]
          );
        }
        for (const ho of synthData.housing || []) {
          await db.query(
            `INSERT INTO registry_housing (
              id, citizen_id, applicant_name, address, district,
              household_income, housing_scheme_id, housing_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO NOTHING;`,
            [
              ho.id, ho.citizen_id, ho.applicant_name, ho.address, ho.district,
              ho.household_income, ho.housing_scheme_id, ho.housing_status
            ]
          );
        }
        for (const l of synthData.land || []) {
          await db.query(
            `INSERT INTO registry_land (
              id, citizen_id, owner_name, survey_number, village,
              district, land_area, ownership_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO NOTHING;`,
            [
              l.id, l.citizen_id, l.owner_name, l.survey_number, l.village,
              l.district, l.land_area, l.ownership_status
            ]
          );
        }
        for (const p of synthData.pan || []) {
          await db.query(
            `INSERT INTO registry_pan (
              id, citizen_id, name, dob, pan_reference, pan_status, category
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO NOTHING;`,
            [
              p.id, p.citizen_id, p.name, p.dob, p.pan_reference, p.pan_status, p.category
            ]
          );
        }
        for (const g of synthData.ground_truth || []) {
          await db.query(
            `INSERT INTO synthetic_entity_ground_truth (
              id, master_citizen_id, source_registry, source_record_id,
              candidate_citizen_id, match_type, ground_truth_match, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO NOTHING;`,
            [
              g.id, g.master_citizen_id, g.source_registry, g.source_record_id,
              g.candidate_citizen_id, g.match_type, g.ground_truth_match, g.notes
            ]
          );
        }
      }
    } catch (synthErr) {
      console.warn("[PGlite] Warning: Auto-seeding synthetic government data failed:", synthErr);
    }
  }
}

export async function pgQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (isProductionDatabase()) {
    const pool = getPostgresPool();
    const res = await pool.query(sql, params);
    return res.rows as T[];
  }

  let db = (await getAuthoritativeDb()) as PGlite;
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
      db = (await getAuthoritativeDb()) as PGlite;
      const res = await db.query(sql, params);
      return res.rows as T[];
    }
    throw err;
  }
}

export async function pgExec(sql: string): Promise<void> {
  if (isProductionDatabase()) {
    const pool = getPostgresPool();
    await pool.query(sql);
    return;
  }

  let db = (await getAuthoritativeDb()) as PGlite;
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
      db = (await getAuthoritativeDb()) as PGlite;
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
  let appUuid = applicationId;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(applicationId);
  if (!isUuid) {
    const row = await pgQuery(`SELECT id FROM applications WHERE application_number = $1`, [applicationId]);
    if (row.length > 0) {
      appUuid = (row[0] as any).id;
    } else {
      return toStatus;
    }
  }

  let actorUuid = actorId;
  const isActorUuid = actorId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actorId);
  if (!isActorUuid) {
    if (actorType === "EMPLOYEE") {
      const emp = await pgQuery(`SELECT auth_user_id FROM employees WHERE employee_code = $1`, [actorId || 'OFF-PAN-7042']);
      actorUuid = (emp[0] as any)?.auth_user_id || "00000000-0000-0000-0000-000000007042";
    } else if (actorType === "CITIZEN") {
      actorUuid = "00000000-0000-0000-0000-000000000002";
    } else {
      actorUuid = "00000000-0000-0000-0000-000000000001";
    }
  }

  const res = await pgQuery(
    `SELECT transition_application_status($1::uuid, $2, $3, $4::uuid, $5) as status`,
    [appUuid, toStatus, actorType, actorUuid, reason || "State transition"]
  );
  return (res[0] as any)?.status as string;
}

function isValidUuid(val?: string | null): boolean {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

export async function resolveApplicationUuid(applicationId?: string | null): Promise<string | null> {
  if (!applicationId) return null;
  if (isValidUuid(applicationId)) return applicationId;
  try {
    const row = await pgQuery(`SELECT id FROM applications WHERE application_number = $1`, [applicationId]);
    if (row.length > 0) return (row[0] as any).id;
  } catch {}
  return null;
}

export async function resolveActorUuid(actorType: string, actorId?: string | null): Promise<string> {
  if (!actorId) return "00000000-0000-0000-0000-000000000001";
  if (isValidUuid(actorId)) return actorId;
  try {
    if (actorType === "EMPLOYEE") {
      const emp = await pgQuery(`SELECT auth_user_id FROM employees WHERE employee_code = $1 OR email = $1`, [actorId]);
      if (emp.length > 0 && isValidUuid((emp[0] as any).auth_user_id)) return (emp[0] as any).auth_user_id;
    } else {
      const u = await pgQuery(`
        SELECT au.id 
        FROM auth.users au 
        LEFT JOIN users u ON lower(au.email) = lower(u.email)
        WHERE u.id = $1 OR au.email = $1 OR au.id::text = $1 
        LIMIT 1`,
        [actorId]
      );
      if (u.length > 0 && isValidUuid((u[0] as any).id)) {
        return (u[0] as any).id;
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
  const actorUuid = await resolveActorUuid(actorType, actorId);
  const appUuid = await resolveApplicationUuid(applicationId);
  const consentUuid = isValidUuid(consentId) ? consentId : null;
  const res = await pgQuery(
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
  return (res[0] as any)?.id as string;
}

export async function closeAuthoritativeDb(): Promise<void> {
  if (globalThis.__formly_pg_pool) {
    try {
      await globalThis.__formly_pg_pool.end();
    } catch {}
    globalThis.__formly_pg_pool = undefined;
  }
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

