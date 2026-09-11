import {
  ProfileField,
  DocumentRow,
  ExtractedField,
  ServiceRequirement,
  RequirementStatusRow,
  ServiceRow,
  DocumentType,
  DocumentStatus,
  RequirementSatisfactionStatus,
} from './database';

export * from './database';
export * from './government';

export interface UserSession {
  id: string;
  email: string;
  name?: string;
}

export interface ProfileCategory {
  id: string;
  title: string;
  description: string;
  iconName: string;
  fields: {
    field_name: string;
    label: string;
    placeholder: string;
    type: 'text' | 'date' | 'number' | 'select';
    options?: string[];
    helpText?: string;
  }[];
}

export interface ChecklistItemViewModel {
  requirement: ServiceRequirement;
  status: RequirementSatisfactionStatus;
  satisfiedByDocument?: DocumentRow | null;
  satisfiedByProfileField?: ProfileField | null;
  resolvedNote?: string | null;
  locked: boolean;
  updatedAt: string;
}

export interface ChecklistSummary {
  service: ServiceRow;
  totalRequirements: number;
  satisfiedCount: number;
  missingCount: number;
  manuallyResolvedCount: number;
  percentageComplete: number;
  items: ChecklistItemViewModel[];
}

export interface OcrExtractionResult {
  documentType: DocumentType;
  rawText: string;
  fields: {
    fieldName: string;
    rawValue: string;
    normalizedValue?: string;
    confidence: number;
  }[];
}

export interface DocumentWithExtractedFields extends DocumentRow {
  extracted_fields: ExtractedField[];
}
