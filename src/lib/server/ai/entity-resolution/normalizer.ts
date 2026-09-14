/**
 * Normalization utilities for Entity Resolution (Phase 5A)
 * Handles case, spaces, initials, Indian address abbreviations, and date formats.
 */

export function normalizeText(text?: string | null): string {
  if (!text) return '';
  return text
    .trim()
    .toUpperCase()
    .replace(/[\s\t\r\n]+/g, ' ');
}

export function normalizeName(name?: string | null): {
  normalized: string;
  tokens: string[];
  initials: string[];
  standardTokens: string[];
} {
  // Replace punctuation/delimiters with spaces first so unspaced initials (e.g. K.Yadav) separate cleanly
  const clean = normalizeText(name)
    .replace(/[\.\,\_\-\/]/g, ' ')
    .replace(/[^A-Z\s]/g, '')
    .replace(/[\s]+/g, ' ')
    .trim();
  const rawTokens = clean.split(' ').filter(t => t.length > 0);

  const initials: string[] = [];
  const standardTokens: string[] = [];

  for (const t of rawTokens) {
    if (t.length === 1) {
      initials.push(t);
    } else {
      standardTokens.push(t);
    }
  }

  return {
    normalized: rawTokens.join(' '),
    tokens: rawTokens,
    initials,
    standardTokens,
  };
}

export function normalizeDate(dateVal?: string | Date | null): string {
  if (!dateVal) return '';
  if (dateVal instanceof Date) {
    return dateVal.toISOString().split('T')[0];
  }
  const str = String(dateVal).trim();
  // Handle ISO or YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD
  const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  // Handle DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  return str;
}

export function normalizeAddress(address?: string | null): {
  normalized: string;
  tokens: string[];
} {
  if (!address) return { normalized: '', tokens: [] };

  let addr = normalizeText(address);
  // Expand or standardize common Indian administrative address tokens
  addr = addr
    .replace(/\bCROSS\s*ROAD\b|\bCROSS\s*RD\b|\bX\s*RD\b|\bX-ROAD\b/g, 'X RD')
    .replace(/\bROAD\b/g, 'RD')
    .replace(/\bSTREET\b/g, 'ST')
    .replace(/\bNAGAR\b/g, 'NGR')
    .replace(/\bCOLONY\b/g, 'COL')
    .replace(/\bENCLAVE\b/g, 'ENC')
    .replace(/\bFLOOR\b/g, 'FLR')
    .replace(/\bBLOCK\b/g, 'BLK')
    .replace(/\bAPARTMENT\b|\bAPARTMENTS\b/g, 'APT')
    .replace(/\bHOUSE\s*NO\b|\bH\s*NO\b|\bH\.NO\b/g, 'HNO')
    .replace(/\bFLAT\s*NO\b/g, 'FLAT')
    .replace(/\bPLOT\s*NO\b/g, 'PLOT')
    .replace(/\bPOST\s*OFFICE\b|\bP\.O\.\b/g, 'PO')
    .replace(/\bNEAR\b|\bNR\.\b/g, 'NR')
    .replace(/\bBEHIND\b|\bBHD\.\b/g, 'BHD')
    .replace(/\bOPPOSITE\b|\bOPP\.\b/g, 'OPP')
    .replace(/\bLANE\b/g, 'LN')
    .replace(/\bMARG\b/g, 'MRG')
    .replace(/\bVILLAGE\b/g, 'VIL')
    .replace(/\bTALUK\b|\bTALUKA\b|\bTEHSIL\b/g, 'TALUK')
    .replace(/\bDISTRICT\b|\bDIST\.\b/g, 'DIST')
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/[\s]+/g, ' ')
    .trim();

  const tokens = addr.split(' ').filter(t => t.length > 1);
  return {
    normalized: addr,
    tokens,
  };
}

export function normalizePincode(pincode?: string | number | null): string {
  if (!pincode) return '';
  const clean = String(pincode).trim().replace(/\D/g, '');
  return clean.slice(0, 6);
}
