import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { WorkflowRouter } from '../src/lib/server/ai/workflow-router';
import { getAuthoritativeDb, pgQuery } from '../src/lib/server/pg-db';

async function ensureShadowTable() {
  await pgQuery(`
    CREATE TABLE IF NOT EXISTS router_shadow_log (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      request_id text NOT NULL,
      user_id text,
      v1_service_id uuid,
      v1_confidence numeric(5,3) NOT NULL,
      v2_service_id uuid,
      v2_probability numeric(5,3) NOT NULL,
      v2_tier text NOT NULL CHECK (v2_tier IN ('AUTOMATIC_RECOMMENDATION','HUMAN_CONFIRMATION_REQUIRED','MANUAL_REVIEW')),
      ood_flag boolean NOT NULL,
      agreement boolean NOT NULL,
      recommendation_diff text,
      v1_version text NOT NULL,
      v2_version text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `, []);
  await pgQuery(`CREATE INDEX IF NOT EXISTS idx_router_shadow_req ON router_shadow_log(request_id);`, []);
  await pgQuery(`CREATE INDEX IF NOT EXISTS idx_router_shadow_created ON router_shadow_log(created_at);`, []);
}



async function run() {
  const filePath = path.resolve('scripts', 'shadow_test_requests.json');
  const raw = fs.readFileSync(filePath, { encoding: 'utf8' });
  const requests = JSON.parse(raw);
  
  await getAuthoritativeDb();
  await ensureShadowTable();

  console.log(`Executing ${requests.length} shadow routing requests...`);
  let successCount = 0;
  for (const req of requests) {
    const routingInput = {
      applicationId: req.applicationId,
      serviceName: req.naturalText,
      applicationTitle: req.naturalText,
      applicationDescription: req.naturalText,
      category: req.category,
      stateCode: req.stateCode,
      documentTypes: req.documentTypes,
      requestedBenefit: req.requestedBenefit,
    };
    const requestId = crypto.randomUUID();
    await WorkflowRouter.compareAndLog(routingInput, requestId, null);
    successCount++;
    if (successCount % 20 === 0) {
      console.log(`  Processed ${successCount}/${requests.length}...`);
    }
  }
  console.log(`Successfully completed: ${successCount} shadow requests processed and logged.`);
}

run().catch((e) => {
  console.error('Error processing shadow requests:', e);
  process.exit(1);
});

