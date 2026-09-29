import { Pool } from "pg";
import crypto from "crypto";

async function main() {
  const password = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD || "";
  const dbUrl = process.env.DATABASE_URL || `postgres://postgres.owpxdieyxpkewsjwqatw:${encodeURIComponent(password)}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`;
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  console.log("Seeding live employees, demo applications, documents, and profile fields into Supabase...");

  // 0. Ensure user accounts exist in auth.users and profiles
  const usersToSeed = [
    { id: "00000000-0000-0000-0000-000000000001", email: "citizen1@example.com", name: "Chiluveri Varshith" },
    { id: "00000000-0000-0000-0000-000000000002", email: "citizen2@example.com", name: "Sai Sankeerth" },
    { id: "00000000-0000-0000-0000-000000007042", email: "sankeerthvss@gmail.com", name: "Officer Sai Sankeerth" },
    { id: "00000000-0000-0000-0000-000000007043", email: "sankeerthvss2@gmail.com", name: "Officer Sai Sankeerth" },
    { id: "00000000-0000-0000-0000-000000001001", email: "rajesh.sharma@incometax.gov.in", name: "Rajesh Sharma" },
    { id: "00000000-0000-0000-0000-000000000099", email: "vikram.rao@negd.gov.in", name: "Vikram Rao" },
  ];

  for (const u of usersToSeed) {
    // Insert into auth.users if not exists
    await pool.query(`
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
      ) VALUES (
        $1::uuid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        $2,
        '$2a$10$abcdefghijklmnopqrstuuNOPQRSTUVWXYZ0123456789abcdefghij',
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        json_build_object('name', $3::text)::jsonb,
        now(),
        now()
      ) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
    `, [u.id, u.email, u.name]);

    // Insert into profiles
    await pool.query(`
      INSERT INTO profiles (user_id, profile_status, created_at, updated_at)
      VALUES ($1::uuid, 'READY', now(), now())
      ON CONFLICT (user_id) DO NOTHING;
    `, [u.id]);
  }
  console.log("✓ Seeded auth.users and profiles");

  // Also maintain public.users table if it exists
  try {
    for (const u of usersToSeed) {
      await pool.query(`
        INSERT INTO users (id, name, email, phone, "passwordHash", salt, role)
        VALUES ($1::uuid, $2, $3, '9876543210', '716fe2c67c519c99ec16c878b72520cb9575ae2183c50058b73f753696803875f9ee76214eaecdf348e3a8fa6a8b792ff48ae501869e5d4cb04ee93a4bc032dc', 'c5bfec7eff377db9d79f52e5ba7ccde0', 'Government Officer')
        ON CONFLICT (id) DO NOTHING;
      `, [u.id, u.name, u.email]);
    }
    console.log("✓ Seeded public.users");
  } catch {
    // public.users optional
  }

  // 1. Employees
  await pool.query(`
    INSERT INTO employees (
      id, auth_user_id, department_id, office_id, employee_code, full_name, email, role, is_active
    ) VALUES
      (
        'f0000000-0000-0000-0000-000000007042',
        '00000000-0000-0000-0000-000000007042',
        'd0000000-0000-0000-0000-000000000002',
        'e0000000-0000-0000-0000-000000000002',
        'OFF-PAN-7042',
        'Officer Sai Sankeerth',
        'sankeerthvss@gmail.com',
        'DEPARTMENT_OFFICER',
        true
      ),
      (
        'f0000000-0000-0000-0000-000000007043',
        '00000000-0000-0000-0000-000000007043',
        'd0000000-0000-0000-0000-000000000002',
        'e0000000-0000-0000-0000-000000000002',
        'OFF-SAN-7043',
        'Officer Sai Sankeerth',
        'sankeerthvss@gmail.com',
        'DEPARTMENT_OFFICER',
        true
      ),
      (
        'f0000000-0000-0000-0000-000000001001',
        '00000000-0000-0000-0000-000000001001',
        'd0000000-0000-0000-0000-000000000002',
        'e0000000-0000-0000-0000-000000000001',
        'ADM-PAN-1001',
        'Rajesh Sharma',
        'rajesh.sharma@incometax.gov.in',
        'DEPARTMENT_ADMIN',
        true
      ),
      (
        'f0000000-0000-0000-0000-000000000099',
        '00000000-0000-0000-0000-000000000099',
        'd0000000-0000-0000-0000-000000000001',
        'e0000000-0000-0000-0000-000000000001',
        'SYS-ROOT-0099',
        'Vikram Rao',
        'vikram.rao@negd.gov.in',
        'SYSTEM_ADMIN',
        true
      )
    ON CONFLICT (id) DO UPDATE SET is_active = true;
  `);
  console.log("✓ Seeded employees");

  // 2. Demo Documents for Sai Sankeerth & Chiluveri Varshith
  const userUuids = [
    "00000000-0000-0000-0000-000000000001",
    "00000000-0000-0000-0000-000000000002",
  ];

  for (const userUuid of userUuids) {
    const docs = [
      { id: `d1000000-0000-0000-0000-${userUuid.slice(-12)}`, type: "AADHAAR", filename: "Aadhaar_Card_Verified.pdf", path: "/vault/aadhaar.pdf" },
      { id: `d2000000-0000-0000-0000-${userUuid.slice(-12)}`, type: "INCOME_CERTIFICATE", filename: "Income_Certificate_2025_26.pdf", path: "/vault/income.pdf" },
      { id: `d3000000-0000-0000-0000-${userUuid.slice(-12)}`, type: "COLLEGE_ID", filename: "College_ID_Card.pdf", path: "/vault/college_id.pdf" },
      { id: `d4000000-0000-0000-0000-${userUuid.slice(-12)}`, type: "MARKSHEET", filename: "Class_10_Matriculation_Memo.pdf", path: "/vault/marksheet.pdf" },
    ];

    for (const d of docs) {
      const hash = crypto.createHash("sha256").update(d.type + userUuid).digest("hex");
      await pool.query(
        `INSERT INTO documents (
          id, user_id, document_type, storage_path, original_filename, mime_type, sha256_hash, status
        ) VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING;`,
        [d.id, userUuid, d.type, d.path, d.filename, "application/pdf", hash, "VERIFIED"]
      );
    }
  }
  console.log("✓ Seeded vault documents");

  // 3. Demo Applications
  const apps = [
    {
      id: "01717c5e-febe-4aeb-ae9d-a19d2b33e411",
      number: "PAN-2026-0001",
      citizenId: "00000000-0000-0000-0000-000000000001",
      serviceId: "a0000000-0000-0000-0000-000000000002",
      status: "OFFICER_REVIEW",
      departmentId: "d0000000-0000-0000-0000-000000000002",
      officeId: "e0000000-0000-0000-0000-000000000002",
      employeeId: "f0000000-0000-0000-0000-000000007042",
      priority: "HIGH",
    },
    {
      id: "01717c5e-febe-4aeb-ae9d-a19d2b33e412",
      number: "PAN-2026-0002",
      citizenId: "00000000-0000-0000-0000-000000000001",
      serviceId: "a0000000-0000-0000-0000-000000000002",
      status: "API_UNAVAILABLE",
      departmentId: "d0000000-0000-0000-0000-000000000002",
      officeId: "e0000000-0000-0000-0000-000000000002",
      employeeId: "f0000000-0000-0000-0000-000000007042",
      priority: "NORMAL",
    },
    {
      id: "01717c5e-febe-4aeb-ae9d-a19d2b33e413",
      number: "PAN-2026-0003",
      citizenId: "00000000-0000-0000-0000-000000000001",
      serviceId: "a0000000-0000-0000-0000-000000000002",
      status: "OFFICER_REVIEW",
      departmentId: "d0000000-0000-0000-0000-000000000002",
      officeId: "e0000000-0000-0000-0000-000000000002",
      employeeId: "f0000000-0000-0000-0000-000000007042",
      priority: "HIGH",
    },
    {
      id: "01717c5e-febe-4aeb-ae9d-a19d2b33e414",
      number: "PAN-2026-0004",
      citizenId: "00000000-0000-0000-0000-000000000001",
      serviceId: "a0000000-0000-0000-0000-000000000002",
      status: "RETURNED_FOR_CORRECTION",
      departmentId: "d0000000-0000-0000-0000-000000000002",
      officeId: "e0000000-0000-0000-0000-000000000002",
      employeeId: "f0000000-0000-0000-0000-000000007042",
      priority: "LOW",
    },
    {
      id: "01717c5e-febe-4aeb-ae9d-a19d2b33e442",
      number: "SCH-2026-0042",
      citizenId: "00000000-0000-0000-0000-000000000002",
      serviceId: "a0000000-0000-0000-0000-000000000001",
      status: "OFFICER_REVIEW",
      departmentId: "d0000000-0000-0000-0000-000000000001",
      officeId: "e0000000-0000-0000-0000-000000000001",
      employeeId: "f0000000-0000-0000-0000-000000007042",
      priority: "HIGH",
    }
  ];

  for (const app of apps) {
    await pool.query(
      `INSERT INTO applications (
        id, application_number, citizen_user_id, service_id, department_id, office_id, assigned_employee_id, status, priority, submitted_at, created_at, updated_at
      ) VALUES ($1::uuid, $2, $3::uuid, $4::uuid, $5::uuid, $6::uuid, $7::uuid, $8, $9, now(), now(), now())
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, priority = EXCLUDED.priority, assigned_employee_id = EXCLUDED.assigned_employee_id;`,
      [app.id, app.number, app.citizenId, app.serviceId, app.departmentId, app.officeId, app.employeeId, app.status, app.priority]
    );
  }
  console.log("✓ Seeded demo applications");

  // 4. Seed profile fields for demo citizens
  const profileFields = [
    { userId: "00000000-0000-0000-0000-000000000001", key: "full_name", val: "Chiluveri Varshith" },
    { userId: "00000000-0000-0000-0000-000000000001", key: "aadhaar_number", val: "999911112222" },
    { userId: "00000000-0000-0000-0000-000000000001", key: "date_of_birth", val: "2004-06-15" },
    { userId: "00000000-0000-0000-0000-000000000001", key: "mobile", val: "9876543210" },
    { userId: "00000000-0000-0000-0000-000000000001", key: "email", val: "chvarshith25@gmail.com" },
    { userId: "00000000-0000-0000-0000-000000000001", key: "gender", val: "MALE" },
    { userId: "00000000-0000-0000-0000-000000000001", key: "district", val: "Hyderabad" },
    { userId: "00000000-0000-0000-0000-000000000001", key: "state", val: "Telangana" },
    { userId: "00000000-0000-0000-0000-000000000001", key: "pincode", val: "500085" },
    { userId: "00000000-0000-0000-0000-000000000001", key: "address", val: "H-No 4-21, Kukatpally, Hyderabad, Telangana 500085" },
    { userId: "00000000-0000-0000-0000-000000000001", key: "annual_income", val: "180000" },

    { userId: "00000000-0000-0000-0000-000000000002", key: "full_name", val: "Sai Sankeerth" },
    { userId: "00000000-0000-0000-0000-000000000002", key: "aadhaar_number", val: "999933334444" },
    { userId: "00000000-0000-0000-0000-000000000002", key: "date_of_birth", val: "2003-11-20" },
    { userId: "00000000-0000-0000-0000-000000000002", key: "mobile", val: "9876543211" },
    { userId: "00000000-0000-0000-0000-000000000002", key: "email", val: "sankeerthvss@gmail.com" },
    { userId: "00000000-0000-0000-0000-000000000002", key: "gender", val: "MALE" },
    { userId: "00000000-0000-0000-0000-000000000002", key: "district", val: "Rangareddy" },
    { userId: "00000000-0000-0000-0000-000000000002", key: "state", val: "Telangana" },
    { userId: "00000000-0000-0000-0000-000000000002", key: "pincode", val: "500072" },
    { userId: "00000000-0000-0000-0000-000000000002", key: "address", val: "Flat 202, KPHB Colony, Hyderabad, Telangana 500072" },
    { userId: "00000000-0000-0000-0000-000000000002", key: "annual_income", val: "120000" },
  ];

  for (const pf of profileFields) {
    await pool.query(
      `INSERT INTO profile_fields (user_id, field_name, field_key, value, verification_status, confidence, confirmed_at, created_at, updated_at)
       VALUES ($1::uuid, $2, $2, $3, 'VERIFIED', 1.0, now(), now(), now())
       ON CONFLICT (user_id, field_key) DO UPDATE SET value = EXCLUDED.value, field_name = EXCLUDED.field_name, verification_status = 'VERIFIED';`,
      [pf.userId, pf.key, pf.val]
    );
  }
  console.log("✓ Seeded profile fields");

  const appCount = await pool.query("SELECT count(*) FROM applications");
  console.log(`\n✓ Live Supabase applications count: ${appCount.rows[0].count}`);

  await pool.end();
}

main().catch(console.error);
