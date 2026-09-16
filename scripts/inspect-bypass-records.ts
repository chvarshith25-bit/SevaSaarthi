import fs from 'fs';

const allRegistries = JSON.parse(fs.readFileSync('data/synthetic/all_registries.json', 'utf8'));
const masterCitizens = JSON.parse(fs.readFileSync('data/synthetic/master_citizens.json', 'utf8'));

const targetCits = ['CIT-00060', 'CIT-00140', 'CIT-00040'];

console.log('MASTER CITIZENS:');
for (const cid of targetCits) {
  const master = masterCitizens.find((c: any) => c.citizen_id === cid || c.id === cid);
  console.log(`\n--- Master ${cid} ---`);
  console.log(JSON.stringify(master, null, 2));

  console.log(`Registry records for ${cid}:`);
  for (const [regName, rows] of Object.entries(allRegistries)) {
    if (regName === 'citizens' || regName === 'ground_truth') continue;
    const matches = (rows as any[]).filter((r: any) => (r.citizen_id === cid || r.master_citizen_id === cid));
    for (const m of matches) {
      console.log(`  [${regName}]`, JSON.stringify(m));
    }
  }
}
