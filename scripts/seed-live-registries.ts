import { Pool } from "pg";
import fs from "fs";

async function main() {
  const password = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD || "";
  const dbUrl = process.env.DATABASE_URL || `postgres://postgres.owpxdieyxpkewsjwqatw:${encodeURIComponent(password)}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`;
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  const synthData = JSON.parse(fs.readFileSync("data/synthetic/all_registries.json", "utf8"));
  console.log("Seeding all synthetic government registries into Supabase...");

  for (const c of synthData.citizens || []) {
    await pool.query(
      `INSERT INTO synthetic_master_citizens (
        citizen_id, full_name, date_of_birth, gender, father_name,
        guardian_name, mobile_number, email, address, district, state,
        pincode, aadhaar_reference, pan_reference
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (citizen_id) DO NOTHING;`,
      [
        c.citizen_id, c.full_name, c.date_of_birth, c.gender, c.father_name,
        c.guardian_name, c.mobile_number, c.email, c.address, c.district, c.state,
        c.pincode, c.aadhaar_reference, c.pan_reference
      ]
    );
  }

  for (const r of synthData.revenue || []) {
    await pool.query(
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
    await pool.query(
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
    await pool.query(
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
    await pool.query(
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
    await pool.query(
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
    await pool.query(
      `INSERT INTO registry_land (
        id, citizen_id, owner_name, survey_number, village, district,
        land_area, ownership_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO NOTHING;`,
      [
        l.id, l.citizen_id, l.owner_name, l.survey_number, l.village, l.district,
        l.land_area, l.ownership_status
      ]
    );
  }

  for (const p of synthData.pan || []) {
    await pool.query(
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
    await pool.query(
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

  console.log("✓ All 7 government registries and 686 ground-truth records seeded into Supabase!");
  await pool.end();
}

main().catch(console.error);
