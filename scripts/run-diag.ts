import { EntityResolutionEngineV3 } from '../src/lib/server/ai/entity-resolution/v3-engine';

async function diag() {
  const input = {
    name: 'Amit Patel',
    dateOfBirth: '1940-01-01',
    allowedRegistries: ['revenue_registry', 'pan_tax_registry'],
    consentVerified: true,
  };
  const res = await EntityResolutionEngineV3.matchEntityV3(input);
  console.log('Result count:', res.candidates.length);
  for (const c of res.candidates) {
    console.log('Candidate:', {
      id: c.candidateId,
      citId: c.citizenId,
      score: c.totalScore,
      tier: c.confidenceTier,
      isCol: c.isCollisionWarning,
      reason: c.collisionReason,
      supporting: c.supportingRegistries,
    });
  }
}
diag().catch(console.error);
