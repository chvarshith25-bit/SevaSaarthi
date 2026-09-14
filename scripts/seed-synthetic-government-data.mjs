import fs from 'fs';
import path from 'path';
import { getAuthoritativeDb, pgQuery } from '../src/lib/server/pg-db.js';

async function seed() {
  console.log('Seeding synthetic government registries from data/synthetic/all_registries.json...');
  await getAuthoritativeDb();

  const dataPath = path.resolve(process.cwd(), 'data/synthetic/all_registries.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error('data/synthetic/all_registries.json does not exist. Run generator first.');
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  console.log('Inserting master citizens: ' + data.citizens.length);
  for (const c of data.citizens) {
    await pgQuery(
      'INSERT INTO synthetic_master_citizens (' +
      'citizen_id, full_name, date_of_birth, gender, father_name, guardian_name, ' +
      'mobile_number, email, address, district, state, pincode, aadhaar_reference, pan_reference' +
      ') VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) ' +
      'ON CONFLICT (citizen_id) DO UPDATE SET ' +
      'full_name = EXCLUDED.full_name, ' +
      'date_of_birth = EXCLUDED.date_of_birth, ' +
      'address = EXCLUDED.address, ' +
      'district = EXCLUDED.district',
      [
        c.citizen_id, c.full_name, c.date_of_birth, c.gender, c.father_name, c.guardian_name,
        c.mobile_number, c.email, c.address, c.district, c.state, c.pincode, c.aadhaar_reference, c.pan_reference
      ]
    );
  }

  console.log('Inserting revenue records: ' + data.revenue.length);
  for (const r of data.revenue) {
    await pgQuery(
      'INSERT INTO registry_revenue (' +
      'id, citizen_id, name, father_name, dob, address, district, ' +
      'income_certificate_number, annual_income, certificate_status, issue_date' +
      ') VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ' +
      'ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, annual_income = EXCLUDED.annual_income',
      [
        r.id, r.citizen_id, r.name, r.father_name, r.dob, r.address, r.district,
        r.income_certificate_number, r.annual_income, r.certificate_status, r.issue_date
      ]
    );
  }

  console.log('Inserting education records: ' + data.education.length);
  for (const e of data.education) {
    await pgQuery(
      'INSERT INTO registry_education (' +
      'id, citizen_id, student_name, dob, college_name, course, ' +
      'scholarship_id, scholarship_status, academic_year, income_reference' +
      ') VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ' +
      'ON CONFLICT (id) DO UPDATE SET student_name = EXCLUDED.student_name',
      [
        e.id, e.citizen_id, e.student_name, e.dob, e.college_name, e.course,
        e.scholarship_id, e.scholarship_status, e.academic_year, e.income_reference
      ]
    );
  }

  console.log('Inserting agriculture records: ' + data.agriculture.length);
  for (const a of data.agriculture) {
    await pgQuery(
      'INSERT INTO registry_agriculture (' +
      'id, citizen_id, farmer_name, village, district, land_reference, ' +
      'pm_kisan_status, bank_reference, eligibility_status' +
      ') VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ' +
      'ON CONFLICT (id) DO UPDATE SET farmer_name = EXCLUDED.farmer_name',
      [
        a.id, a.citizen_id, a.farmer_name, a.village, a.district, a.land_reference,
        a.pm_kisan_status, a.bank_reference, a.eligibility_status
      ]
    );
  }

  console.log('Inserting health records: ' + data.health.length);
  for (const h of data.health) {
    await pgQuery(
      'INSERT INTO registry_health (' +
      'id, citizen_id, beneficiary_name, dob, health_scheme_id, ' +
      'ayushman_status, family_reference, eligibility_status' +
      ') VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ' +
      'ON CONFLICT (id) DO UPDATE SET beneficiary_name = EXCLUDED.beneficiary_name',
      [
        h.id, h.citizen_id, h.beneficiary_name, h.dob, h.health_scheme_id,
        h.ayushman_status, h.family_reference, h.eligibility_status
      ]
    );
  }

  console.log('Inserting housing records: ' + data.housing.length);
  for (const h of data.housing) {
    await pgQuery(
      'INSERT INTO registry_housing (' +
      'id, citizen_id, applicant_name, address, district, ' +
      'household_income, housing_scheme_id, housing_status' +
      ') VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ' +
      'ON CONFLICT (id) DO UPDATE SET applicant_name = EXCLUDED.applicant_name',
      [
        h.id, h.citizen_id, h.applicant_name, h.address, h.district,
        h.household_income, h.housing_scheme_id, h.housing_status
      ]
    );
  }

  console.log('Inserting land records: ' + data.land.length);
  for (const l of data.land) {
    await pgQuery(
      'INSERT INTO registry_land (' +
      'id, citizen_id, owner_name, survey_number, village, district, ' +
      'land_area, ownership_status' +
      ') VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ' +
      'ON CONFLICT (id) DO UPDATE SET owner_name = EXCLUDED.owner_name',
      [
        l.id, l.citizen_id, l.owner_name, l.survey_number, l.village, l.district,
        l.land_area, l.ownership_status
      ]
    );
  }

  console.log('Inserting PAN records: ' + data.pan.length);
  for (const p of data.pan) {
    await pgQuery(
      'INSERT INTO registry_pan (' +
      'id, citizen_id, name, dob, pan_reference, pan_status, category' +
      ') VALUES ($1, $2, $3, $4, $5, $6, $7) ' +
      'ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name',
      [
        p.id, p.citizen_id, p.name, p.dob, p.pan_reference, p.pan_status, p.category
      ]
    );
  }

  console.log('Inserting ground truth links: ' + data.ground_truth.length);
  for (const g of data.ground_truth) {
    await pgQuery(
      'INSERT INTO synthetic_entity_ground_truth (' +
      'id, master_citizen_id, source_registry, source_record_id, ' +
      'candidate_citizen_id, match_type, ground_truth_match, notes' +
      ') VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ' +
      'ON CONFLICT (id) DO NOTHING',
      [
        g.id, g.master_citizen_id, g.source_registry, g.source_record_id,
        g.candidate_citizen_id, g.match_type, g.ground_truth_match, g.notes
      ]
    );
  }

  console.log('SUCCESS: All synthetic registries and ground-truth links seeded!');
}

seed().catch(err => {
  console.error('Seed failure:', err);
  process.exit(1);
});
