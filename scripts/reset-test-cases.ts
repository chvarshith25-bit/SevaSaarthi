import { getAuthoritativeDb, pgQuery } from "../src/lib/server/pg-db";
import { getApplicationById, updatePanApplication } from "../src/lib/server/db";

async function main() {
  await getAuthoritativeDb();

  // Reset PAN-2026-0001
  await pgQuery(
    `UPDATE applications SET current_status = 'ACTION_REQUIRED', current_stage = 'GOVERNMENT_PROCESSING' WHERE application_number = 'PAN-2026-0001'`
  );
  const pan1 = await getApplicationById("PAN-2026-0001");
  if (pan1) {
    pan1.status = "ACTION_REQUIRED";
    pan1.stage = "GOVERNMENT_PROCESSING";
    await updatePanApplication(pan1);
  }

  // Reset PAN-2026-0002
  await pgQuery(
    `UPDATE applications SET current_status = 'API_UNAVAILABLE', current_stage = 'VERIFICATION_IN_PROGRESS' WHERE application_number = 'PAN-2026-0002'`
  );
  const pan2 = await getApplicationById("PAN-2026-0002");
  if (pan2) {
    pan2.status = "API_UNAVAILABLE";
    pan2.stage = "VERIFICATION_IN_PROGRESS";
    await updatePanApplication(pan2);
  }

  // Reset PAN-2026-0003
  await pgQuery(
    `UPDATE applications SET current_status = 'VERIFICATION_CONFLICT', current_stage = 'GOVERNMENT_PROCESSING' WHERE application_number = 'PAN-2026-0003'`
  );
  const pan3 = await getApplicationById("PAN-2026-0003");
  if (pan3) {
    pan3.status = "VERIFICATION_CONFLICT";
    pan3.stage = "GOVERNMENT_PROCESSING";
    await updatePanApplication(pan3);
  }

  console.log("Successfully reset test applications: PAN-2026-0001, PAN-2026-0002, PAN-2026-0003");
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("Error resetting test cases:", err);
  process.exit(1);
});
