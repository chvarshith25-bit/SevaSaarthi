/**
 * Seva Saarthi Model 2 - Stage-A Candidate Retrieval Evaluator
 * 
 * Standalone, retrieval-only evaluation across V1, V3.1, and V4.2:
 * 1. Generates candidate pool for each benchmark query without ranking.
 * 2. Checks if expected master citizen identity is present in candidate pool.
 * 3. Records retrieval recall, candidate count percentiles (p50/p95/p99).
 * 4. Breaks down retrieval performance by registry, language, surname, and variation category.
 * 5. Uses identical database snapshot, identical authorization scope, identical candidate pool.
 */

import fs from 'fs';
import path from 'path';
import { generateCleanSeed20202Benchmark, BenchmarkQuery } from './benchmark-model2-v4-seed20202';
import { retrieveAuthorizedCandidates } from '../src/lib/server/ai/entity-resolution/candidate-retriever';
import { getAuthoritativeDb } from '../src/lib/server/pg-db';

function calculatePercentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
  return sorted[idx];
}

export interface RetrievalEvaluationResults {
  engine: string;
  totalQueries: number;
  positiveQueries: number;
  retrievedCount: number;
  missedCount: number;
  retrievalRecall: number;
  candidateCountP50: number;
  candidateCountP95: number;
  candidateCountP99: number;
  missesByRegistry: Record<string, number>;
  missesByLanguage: Record<string, number>;
  missesBySurname: Record<string, number>;
  missesByVariation: Record<string, number>;
  surnameStats: Record<string, { total: number; retrieved: number; recall: number }>;
}

export async function evaluateStageARetrieval(): Promise<{
  v1: RetrievalEvaluationResults;
  v3: RetrievalEvaluationResults;
  v4: RetrievalEvaluationResults;
}> {
  console.log('========================================================================');
  console.log('   STAGE-A CANDIDATE RETRIEVAL EVALUATOR (SEED=20202)                    ');
  console.log('========================================================================\n');

  await getAuthoritativeDb();
  const benchmarkQueries = await generateCleanSeed20202Benchmark();
  const positiveQueries = benchmarkQueries.filter((q) => q.isMatch && q.expectedCitizenId);

  const allRegistriesData = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'data/synthetic/all_registries.json'), 'utf8')
  );
  const citizenMap = new Map<string, any>();
  for (const c of allRegistriesData.citizens || []) {
    citizenMap.set(c.citizen_id, c);
  }

  const SURNAMES_TO_TRACK = ['Kumar', 'Sharma', 'Patel', 'Yadav', 'Naidu', 'Reddy', 'Verma', 'Singh'];

  async function evaluateEngine(engineName: string): Promise<RetrievalEvaluationResults> {
    console.log(`>>> Evaluating Stage-A Candidate Retrieval for ${engineName}...`);
    const candidateCounts: number[] = [];
    let retrievedCount = 0;
    let missedCount = 0;

    const missesByRegistry: Record<string, number> = {};
    const missesByLanguage: Record<string, number> = { en: 0, hi: 0, te: 0, transliterated_indic: 0 };
    const missesBySurname: Record<string, number> = {};
    const missesByVariation: Record<string, number> = {};
    const surnameStats: Record<string, { total: number; retrieved: number; recall: number }> = {};

    for (const sn of SURNAMES_TO_TRACK) {
      surnameStats[sn] = { total: 0, retrieved: 0, recall: 0 };
    }

    for (const item of positiveQueries) {
      const cit = citizenMap.get(item.expectedCitizenId!);
      const citSurname = SURNAMES_TO_TRACK.find((s) => cit?.full_name?.toLowerCase().includes(s.toLowerCase())) || 'Other';
      if (surnameStats[citSurname]) {
        surnameStats[citSurname].total++;
      }

      // Shared candidate retrieval (Top-N=25)
      const rawCandidates = await retrieveAuthorizedCandidates(item.query, 25);
      candidateCounts.push(rawCandidates.length);

      const retrievedCitIds = rawCandidates.map(
        (c) => c.row.citizen_id || c.row.master_citizen_id || c.row.id
      );

      const isHit = retrievedCitIds.includes(item.expectedCitizenId!);

      if (isHit) {
        retrievedCount++;
        if (surnameStats[citSurname]) {
          surnameStats[citSurname].retrieved++;
        }
      } else {
        missedCount++;
        const reg = item.expectedRegistry || 'unknown';
        missesByRegistry[reg] = (missesByRegistry[reg] || 0) + 1;
        missesByLanguage[item.language] = (missesByLanguage[item.language] || 0) + 1;
        missesBySurname[citSurname] = (missesBySurname[citSurname] || 0) + 1;
        missesByVariation[item.category] = (missesByVariation[item.category] || 0) + 1;
      }
    }

    for (const sn of Object.keys(surnameStats)) {
      const s = surnameStats[sn];
      s.recall = s.total > 0 ? Number(((s.retrieved / s.total) * 100).toFixed(2)) : 100;
    }

    const recall = Number(((retrievedCount / positiveQueries.length) * 100).toFixed(2));

    return {
      engine: engineName,
      totalQueries: benchmarkQueries.length,
      positiveQueries: positiveQueries.length,
      retrievedCount,
      missedCount,
      retrievalRecall: recall,
      candidateCountP50: calculatePercentile(candidateCounts, 50),
      candidateCountP95: calculatePercentile(candidateCounts, 95),
      candidateCountP99: calculatePercentile(candidateCounts, 99),
      missesByRegistry,
      missesByLanguage,
      missesBySurname,
      missesByVariation,
      surnameStats,
    };
  }

  const v1Results = await evaluateEngine('Model 2 V1 Deterministic');
  const v3Results = await evaluateEngine('Model 2 V3.1 Structured');
  const v4Results = await evaluateEngine('Model 2 V4.2 Hybrid Transformer');

  console.log('\n========================================================================');
  console.log('              STAGE-A CANDIDATE RETRIEVAL SUMMARY                       ');
  console.log('========================================================================');
  console.table([
    {
      Engine: v1Results.engine,
      Positive: v1Results.positiveQueries,
      Retrieved: v1Results.retrievedCount,
      Missed: v1Results.missedCount,
      Recall: `${v1Results.retrievalRecall}%`,
      p50_Count: v1Results.candidateCountP50,
      p95_Count: v1Results.candidateCountP95,
      p99_Count: v1Results.candidateCountP99,
    },
    {
      Engine: v3Results.engine,
      Positive: v3Results.positiveQueries,
      Retrieved: v3Results.retrievedCount,
      Missed: v3Results.missedCount,
      Recall: `${v3Results.retrievalRecall}%`,
      p50_Count: v3Results.candidateCountP50,
      p95_Count: v3Results.candidateCountP95,
      p99_Count: v3Results.candidateCountP99,
    },
    {
      Engine: v4Results.engine,
      Positive: v4Results.positiveQueries,
      Retrieved: v4Results.retrievedCount,
      Missed: v4Results.missedCount,
      Recall: `${v4Results.retrievalRecall}%`,
      p50_Count: v4Results.candidateCountP50,
      p95_Count: v4Results.candidateCountP95,
      p99_Count: v4Results.candidateCountP99,
    },
  ]);

  console.log('\n--- RETRIEVAL RECALL BY COMMON SURNAME (V4.2) ---');
  console.table(v4Results.surnameStats);

  return { v1: v1Results, v3: v3Results, v4: v4Results };
}

if (process.argv[1]?.endsWith('evaluate-model2-v4-stage-a-retrieval.ts')) {
  evaluateStageARetrieval().catch((err) => {
    console.error('[FATAL] Stage-A retrieval evaluation failed:', err);
    process.exit(1);
  });
}
