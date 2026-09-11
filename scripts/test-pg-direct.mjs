import { getAuthoritativeDb } from "../src/lib/server/pg-db.ts";

async function test() {
  console.log("Starting getAuthoritativeDb test...");
  const t0 = Date.now();
  const db = await getAuthoritativeDb();
  console.log("getAuthoritativeDb finished in", Date.now() - t0, "ms");
  const res = await db.query("SELECT count(*) FROM applications");
  console.log("Applications count:", res.rows);
  process.exit(0);
}

test().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});
