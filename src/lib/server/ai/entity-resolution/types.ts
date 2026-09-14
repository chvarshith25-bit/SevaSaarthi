/**
 * Entity Resolution Model 2 Type Definitions (Phase 5A + Phase 5B)
 */

export type RegistryKey =
  | 'revenue_registry'
  | 'education_registry'
  | 'agriculture_registry'
  | 'health_registry'
  | 'housing_registry'
  | 'land_registry'
  | 'pan_tax_registry';

export type MatchConfidenceTier = 'HIGH' | 'MEDIUM' | 'LOW' | 'AMBIGUOUS';

export interface EntityResolutionInput {
  name: string;
  dateOfBirth?: string; // YYYY-MM-DD
  fatherName?: string;
  guardianName?: string;
  address?: string;
  district?: string;
  state?: string;
  pincode?: string;
  aadhaarReference?: string;
  panReference?: string;
  identityReference?: string;
  allowedRegistries: RegistryKey[];
  consentVerified: boolean;
  requestingApplicationId?: string;
  purpose?: string;
  enableSemanticEmbeddings?: boolean;
  enableGraphCorroboration?: boolean;
}

export interface FieldSimilarityScores {
  nameScore: number;       // 0.0 - 1.0
  dobScore: number;        // 0.0 - 1.0
  fatherScore: number;     // 0.0 - 1.0 (or 1.0 if not applicable / absent in registry)
  addressScore: number;    // 0.0 - 1.0
  districtScore: number;   // 0.0 - 1.0
  pincodeScore: number;    // 0.0 - 1.0
  embeddingScore?: number; // 0.0 - 1.0 (Phase 5B semantic cosine similarity)
  graphBonus?: number;     // 0.0 - 0.08 (Phase 5B cross-registry graph bonus)
}

export interface CandidateMatchResult {
  candidateId: string;     // Record ID in source registry
  citizenId?: string;      // FK to master citizen if present
  registry: RegistryKey;
  matchedFields: string[];
  fieldScores: FieldSimilarityScores;
  totalScore: number;      // 0.0 - 1.0
  confidenceTier: MatchConfidenceTier;
  isCollisionWarning: boolean;
  collisionReason?: string;
  corroborationReason?: string;
  explanation: string;
  rawRecord: Record<string, any>;
}

export interface EntityResolutionResponse {
  querySummary: {
    name: string;
    searchedRegistries: RegistryKey[];
    totalCandidatesFound: number;
    embeddingModelId?: string;
  };
  candidates: CandidateMatchResult[];
  bestMatch?: CandidateMatchResult;
  ambiguityDetected: boolean;
  disclaimer: string;
}

export const ENTITY_RESOLUTION_THRESHOLDS = {
  HIGH_CONFIDENCE: 0.85,
  MEDIUM_CONFIDENCE: 0.70,
  LOW_CONFIDENCE: 0.50,
  AMBIGUITY_SCORE_DELTA: 0.05,
  COLLISION_NAME_THRESHOLD: 0.85,
  COLLISION_DOB_CONFLICT_THRESHOLD: 0.20,
  COLLISION_FATHER_CONFLICT_THRESHOLD: 0.60,
  COLLISION_DISTRICT_CONFLICT_THRESHOLD: 0.60,
  COLLISION_ADDRESS_CONFLICT_THRESHOLD: 0.25,
} as const;
