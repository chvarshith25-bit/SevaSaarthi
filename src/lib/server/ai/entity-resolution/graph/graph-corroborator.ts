import { CandidateMatchResult } from '../types';

export interface GraphCorroborationResult {
  candidateId: string;
  registry: string;
  corroboratedByRegistry?: string;
  corroboratedByCandidateId?: string;
  corroborationBonus: number;
  corroborationReason?: string;
}

export class CrossRegistryGraphCorroborator {
  static corroborateCandidates(
    candidates: CandidateMatchResult[]
  ): Map<string, GraphCorroborationResult> {
    const results = new Map<string, GraphCorroborationResult>();

    const anchorNodes = candidates.filter(
      c => c.confidenceTier === 'HIGH' && 
           c.totalScore >= 0.85 && 
           (c.fieldScores.dobScore >= 0.85 || c.fieldScores.fatherScore >= 0.85) &&
           !c.isCollisionWarning
    );

    if (anchorNodes.length === 0) {
      for (const c of candidates) {
        results.set(c.candidateId, {
          candidateId: c.candidateId,
          registry: c.registry,
          corroborationBonus: 0,
        });
      }
      return results;
    }

    for (const cand of candidates) {
      const isAnchor = anchorNodes.some(a => a.candidateId === cand.candidateId);
      if (isAnchor) {
        results.set(cand.candidateId, {
          candidateId: cand.candidateId,
          registry: cand.registry,
          corroborationBonus: 0,
        });
        continue;
      }

      let bestBonus = 0;
      let bestAnchor: CandidateMatchResult | null = null;
      let reason: string | undefined;

      for (const anchor of anchorNodes) {
        if (anchor.registry === cand.registry) continue;

        const candRaw = cand.rawRecord || {};
        const anchorRaw = anchor.rawRecord || {};

        const candDist = String(candRaw.district || candRaw.district_name || '').toUpperCase().trim();
        const anchorDist = String(anchorRaw.district || anchorRaw.district_name || '').toUpperCase().trim();
        const isDistCompatible = (candDist && anchorDist && candDist === anchorDist) || (!candDist && anchorDist);

        const nameScore = cand.fieldScores.nameScore;

        if (nameScore >= 0.85 && isDistCompatible && !cand.isCollisionWarning) {
          let bonus = 0.04;
          if (cand.fieldScores.districtScore >= 0.90) {
            bonus += 0.02;
          }

          if (bonus > bestBonus) {
            bestBonus = bonus;
            bestAnchor = anchor;
            reason = `Corroborated by high-confidence ${anchor.registry} anchor (${anchor.candidateId}) via matching name & district (${candDist || 'consistent'}).`;
          }
        }
      }

      results.set(cand.candidateId, {
        candidateId: cand.candidateId,
        registry: cand.registry,
        corroboratedByRegistry: bestAnchor?.registry,
        corroboratedByCandidateId: bestAnchor?.candidateId,
        corroborationBonus: bestBonus,
        corroborationReason: reason,
      });
    }

    return results;
  }
}
