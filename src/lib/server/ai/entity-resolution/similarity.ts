import { normalizeName, normalizeDate, normalizeAddress, normalizePincode } from './normalizer';

export function jaroSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const len1 = s1.length;
  const len2 = s2.length;
  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;

  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);

  let matches = 0;
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);
    for (let j = start; j < end; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  let transpositions = 0;
  for (let i = 0; i < len1; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }
  }

  const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
  return jaro;
}

export function jaroWinklerSimilarity(s1: string, s2: string, prefixScale = 0.1): number {
  const jaro = jaroSimilarity(s1, s2);
  if (jaro < 0.7) return jaro;

  let prefix = 0;
  const maxPrefix = Math.min(4, Math.min(s1.length, s2.length));
  for (let i = 0; i < maxPrefix; i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  return Math.min(1.0, jaro + prefix * prefixScale * (1.0 - jaro));
}

export function tokenJaccardSimilarity(tokens1: string[], tokens2: string[]): number {
  if (tokens1.length === 0 && tokens2.length === 0) return 1.0;
  if (tokens1.length === 0 || tokens2.length === 0) return 0.0;

  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  let intersection = 0;
  for (const t of set1) {
    if (set2.has(t)) intersection++;
  }

  const union = new Set([...tokens1, ...tokens2]).size;
  return union === 0 ? 1.0 : intersection / union;
}

export function computeNameSimilarity(name1?: string | null, name2?: string | null): number {
  if (!name1 || !name2) return 0.0;

  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);

  if (n1.normalized === n2.normalized) return 1.0;

  const sorted1 = [...n1.tokens].sort().join(' ');
  const sorted2 = [...n2.tokens].sort().join(' ');
  if (sorted1 === sorted2) return 0.98;

  const isInitialsCompatible = checkInitialsCompatibility(n1, n2);
  if (isInitialsCompatible) {
    return 0.92;
  }

  const jwFull = jaroWinklerSimilarity(n1.normalized, n2.normalized);
  const jaccard = tokenJaccardSimilarity(n1.tokens, n2.tokens);

  return Math.max(jwFull, jaccard);
}

function checkInitialsCompatibility(
  n1: ReturnType<typeof normalizeName>,
  n2: ReturnType<typeof normalizeName>
): boolean {
  if (n1.tokens.length === 0 || n2.tokens.length === 0) return false;

  // At least one name must contain a single-letter initial
  const hasInitials = n1.tokens.some(t => t.length === 1) || n2.tokens.some(t => t.length === 1);
  if (!hasInitials) return false;

  // Must share at least one standard full-word token (e.g. given name)
  const sharedStandard = n1.standardTokens.filter(t => n2.standardTokens.includes(t));
  if (sharedStandard.length === 0) return false;

  // Get non-shared tokens for each side
  const nonShared1 = [...n1.tokens.filter(t => !sharedStandard.includes(t))];
  const nonShared2 = [...n2.tokens.filter(t => !sharedStandard.includes(t))];

  if (nonShared1.length === 0 && nonShared2.length === 0) return true;

  let matchedCount = 0;

  // Match initials in nonShared1 to corresponding words in nonShared2
  for (let i = nonShared1.length - 1; i >= 0; i--) {
    const t1 = nonShared1[i];
    if (t1.length === 1) {
      const matchIdx = nonShared2.findIndex(t2 => t2.startsWith(t1));
      if (matchIdx !== -1) {
        nonShared1.splice(i, 1);
        nonShared2.splice(matchIdx, 1);
        matchedCount++;
      }
    }
  }

  // Match initials in nonShared2 to corresponding words in nonShared1
  for (let i = nonShared2.length - 1; i >= 0; i--) {
    const t2 = nonShared2[i];
    if (t2.length === 1) {
      const matchIdx = nonShared1.findIndex(t1 => t1.startsWith(t2));
      if (matchIdx !== -1) {
        nonShared2.splice(i, 1);
        nonShared1.splice(matchIdx, 1);
        matchedCount++;
      }
    }
  }

  if (matchedCount === 0) return false;

  // CRITICAL GUARD: After pairing initials to full words, neither side can contain
  // conflicting full words (tokens with length > 1) or leftover unmatched initials.
  // (Prevents false matches like "Suresh Kumar Sharma" ~ "Suresh K Verma" or "Amit Patel" ~ "Amit P Sharma")
  if (nonShared1.length > 0 || nonShared2.length > 0) {
    return false;
  }

  return true;
}

export function computeDobSimilarity(dob1?: string | Date | null, dob2?: string | Date | null): number {
  if (!dob1 || !dob2) return 0.5;

  const d1 = normalizeDate(dob1);
  const d2 = normalizeDate(dob2);

  if (!d1 || !d2) return 0.5;
  if (d1 === d2) return 1.0;

  const parts1 = d1.split('-');
  const parts2 = d2.split('-');
  if (parts1.length !== 3 || parts2.length !== 3) {
    return 0.0;
  }

  const [y1, m1, day1] = parts1;
  const [y2, m2, day2] = parts2;

  if (y1 === y2) {
    if (m1 === m2) return 0.75;
    if (m1 === day2 && day1 === m2) return 0.85; // Day/Month transposed
    return 0.50;
  }

  // Same day and month, year within 1 year
  if (m1 === m2 && day1 === day2 && Math.abs(parseInt(y1, 10) - parseInt(y2, 10)) <= 1) {
    return 0.40;
  }

  return 0.0;
}

export function computeAddressSimilarity(addr1?: string | null, addr2?: string | null): number {
  if (!addr1 || !addr2) return 0.5;

  const a1 = normalizeAddress(addr1);
  const a2 = normalizeAddress(addr2);

  if (a1.normalized === a2.normalized) return 1.0;
  if (!a1.normalized || !a2.normalized) return 0.5;

  const jaccard = tokenJaccardSimilarity(a1.tokens, a2.tokens);
  const jw = jaroWinklerSimilarity(a1.normalized, a2.normalized);

  // Check token containment (e.g. village name contained in full street address)
  let containment = 0.0;
  if (a1.tokens.length > 0 && a2.tokens.length > 0) {
    const set1 = new Set(a1.tokens);
    const set2 = new Set(a2.tokens);
    let intersection = 0;
    for (const t of set1) {
      if (set2.has(t)) intersection++;
    }
    const minSize = Math.min(set1.size, set2.size);
    containment = minSize > 0 ? intersection / minSize : 0.0;
  }

  const isSubstring = a1.normalized.includes(a2.normalized) || a2.normalized.includes(a1.normalized);

  let score = 0.0;
  if (containment >= 0.80) {
    score = Math.max(0.85, jaccard);
  } else if (isSubstring) {
    score = Math.max(0.80, jaccard);
  } else if (jaccard > 0) {
    score = Math.max(jaccard, jw * 0.75);
  } else {
    // If there are zero shared tokens and no containment, the addresses are completely distinct
    score = jw >= 0.80 ? jw * 0.50 : jw * 0.20;
  }

  return Number(score.toFixed(4));
}


export function computeDistrictSimilarity(dist1?: string | null, dist2?: string | null): number {
  if (!dist1 || !dist2) return 0.5;

  const d1 = dist1.trim().toUpperCase();
  const d2 = dist2.trim().toUpperCase();

  if (d1 === d2) return 1.0;
  return jaroWinklerSimilarity(d1, d2);
}

export function computePincodeSimilarity(pin1?: string | number | null, pin2?: string | number | null): number {
  if (!pin1 || !pin2) return 0.5;

  const p1 = normalizePincode(pin1);
  const p2 = normalizePincode(pin2);

  if (!p1 || !p2) return 0.5;
  if (p1 === p2) return 1.0;

  if (p1.slice(0, 4) === p2.slice(0, 4)) {
    return 0.80; // Same sub-district delivery area
  }

  if (p1.slice(0, 3) === p2.slice(0, 3)) {
    return 0.60; // Same sorting district
  }

  if (p1.slice(0, 2) === p2.slice(0, 2)) {
    return 0.30; // Same postal circle / state region
  }

  return 0.0;
}
