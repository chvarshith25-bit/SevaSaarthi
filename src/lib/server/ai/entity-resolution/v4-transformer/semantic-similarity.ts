/**
 * Seva Saarthi AI Model 2 V4 - Semantic Representation & Similarity
 * 
 * Generates controlled field-aware semantic text representations for queries
 * and candidate registry records while strictly stripping raw sensitive PII identifiers.
 */

import { EntityResolutionInput, RegistryKey } from '../types';
import { SemanticRepresentation } from './types';
import * as crypto from 'crypto';

const SENSITIVE_KEY_PATTERNS = [
  /aadhaar/i,
  /uidai/i,
  /pan/i,
  /bank/i,
  /account/i,
  /ifsc/i,
  /password/i,
  /secret/i,
  /auth/i,
  /token/i,
  /id$/i, // e.g. candidate_id, db internal ids
];

export class SemanticSimilarityEngine {
  /**
   * Formats a field-specific semantic representation.
   */
  public static formatFieldSemanticText(
    fieldName: 'name' | 'address' | 'district' | 'father',
    value: string,
    isQuery: boolean
  ): SemanticRepresentation {
    const prefix = isQuery ? 'query: ' : 'passage: ';
    const cleanVal = (value || '').trim();
    const rawText = `${fieldName}: ${cleanVal}`;
    const e5Text = `${prefix}${rawText}`;
    const contentHash = crypto.createHash('sha256').update(rawText.toLowerCase(), 'utf8').digest('hex');

    return {
      text: e5Text,
      contentHash,
      fieldCount: cleanVal ? 1 : 0,
      hasSensitiveFields: false,
    };
  }

  /**
   * Formats composite field-aware representations:
   * A. Name
   * B. Name + Address
   * C. Name + District
   * D. Name + Address + District
   * E. Full authorized semantic profile
   */
  public static formatCompositeSemanticText(
    fields: {
      name?: string;
      fatherName?: string;
      guardianName?: string;
      address?: string;
      district?: string;
      state?: string;
      pincode?: string | number;
    },
    mode: 'NAME_ONLY' | 'NAME_ADDRESS' | 'NAME_DISTRICT' | 'NAME_ADDRESS_DISTRICT' | 'FULL_PROFILE',
    isQuery: boolean
  ): SemanticRepresentation {
    const parts: string[] = [];
    const prefix = isQuery ? 'query: ' : 'passage: ';

    if (fields.name) {
      parts.push(`name: ${String(fields.name).trim()}`);
    }

    if (mode === 'NAME_ADDRESS' || mode === 'NAME_ADDRESS_DISTRICT' || mode === 'FULL_PROFILE') {
      if (fields.address) {
        parts.push(`address: ${String(fields.address).trim()}`);
      }
    }

    if (mode === 'NAME_DISTRICT' || mode === 'NAME_ADDRESS_DISTRICT' || mode === 'FULL_PROFILE') {
      if (fields.district) {
        parts.push(`district: ${String(fields.district).trim()}`);
      }
    }

    if (mode === 'FULL_PROFILE') {
      if (fields.fatherName) {
        parts.push(`father: ${String(fields.fatherName).trim()}`);
      } else if (fields.guardianName) {
        parts.push(`guardian: ${String(fields.guardianName).trim()}`);
      }
      if (fields.state) {
        parts.push(`state: ${String(fields.state).trim()}`);
      }
      if (fields.pincode) {
        parts.push(`pincode: ${String(fields.pincode).trim()}`);
      }
    }

    const rawText = parts.join(' | ');
    const e5Text = `${prefix}${rawText}`;
    const contentHash = crypto.createHash('sha256').update(rawText.toLowerCase(), 'utf8').digest('hex');

    return {
      text: e5Text,
      contentHash,
      fieldCount: parts.length,
      hasSensitiveFields: false,
    };
  }

  /**
   * Formats a controlled semantic query representation with the "query: " e5 prefix.
   */
  public static formatQuerySemanticText(input: EntityResolutionInput): SemanticRepresentation {
    return SemanticSimilarityEngine.formatCompositeSemanticText(input, 'FULL_PROFILE', true);
  }

  /**
   * Formats a controlled semantic passage representation from a candidate registry row
   * with the "passage: " e5 prefix. Strips all raw sensitive identifiers.
   */
  public static formatPassageSemanticText(
    row: Record<string, any>,
    registry: RegistryKey
  ): SemanticRepresentation {
    const name = row.name || row.student_name || row.farmer_name || row.beneficiary_name || row.applicant_name || row.owner_name || row.full_name;
    const father = row.father_name || row.guardian_name || row.father;
    const address = row.address || row.village || row.street;
    const district = row.district;
    const state = row.state;
    const pincode = row.pincode || row.pin_code;

    // Audit for sensitive patterns
    let hasSensitive = false;
    for (const key of Object.keys(row)) {
      for (const pattern of SENSITIVE_KEY_PATTERNS) {
        if (pattern.test(key) && key !== 'district') {
          hasSensitive = true;
          break;
        }
      }
    }

    const rep = SemanticSimilarityEngine.formatCompositeSemanticText(
      { name, fatherName: father, address, district, state, pincode },
      'FULL_PROFILE',
      false
    );

    return {
      ...rep,
      hasSensitiveFields: hasSensitive,
    };
  }

  /**
   * Computes cosine similarity between two 768-d unit-normalized float vectors.
   */
  public static computeCosineSimilarity(vecA: Float32Array, vecB: Float32Array): number {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
      return 0.0;
    }

    let dot = 0.0;
    let normA = 0.0;
    let normB = 0.0;

    for (let i = 0; i < vecA.length; i++) {
      const a = vecA[i];
      const b = vecB[i];
      dot += a * b;
      normA += a * a;
      normB += b * b;
    }

    if (normA <= 0.0 || normB <= 0.0 || !Number.isFinite(normA) || !Number.isFinite(normB)) return 0.0;
    const cosine = dot / (Math.sqrt(normA) * Math.sqrt(normB));
    if (!Number.isFinite(cosine) || Number.isNaN(cosine)) return 0.0;
    
    // Scale cosine from [-1.0, 1.0] to [0.0, 1.0]
    const scaled = (cosine + 1.0) / 2.0;
    if (!Number.isFinite(scaled) || Number.isNaN(scaled)) return 0.0;
    return Math.max(0.0, Math.min(1.0, scaled));
  }
}
