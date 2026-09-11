export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DocumentType =
  | 'AADHAAR'
  | 'INCOME_CERTIFICATE'
  | 'COLLEGE_ID'
  | 'PREVIOUS_MARKSHEET'
  | 'BANK_PASSBOOK'
  | 'CASTE_CERTIFICATE'
  | 'DOMICILE_CERTIFICATE'
  | 'OTHER';

export type DocumentStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'EXTRACTED'
  | 'VERIFIED'
  | 'FAILED';

export type RequirementType =
  | 'IDENTITY_DOCUMENT'
  | 'ADDRESS_DOCUMENT'
  | 'INCOME_DOCUMENT'
  | 'EDUCATION_DOCUMENT'
  | 'BANK_DOCUMENT'
  | 'PHOTO'
  | 'SIGNATURE'
  | 'PERSONAL_INFORMATION'
  | 'DECLARATION';

export type RequirementSatisfactionStatus =
  | 'MISSING'
  | 'SATISFIED'
  | 'MANUALLY_RESOLVED';

export interface ProfileField {
  id: string;
  user_id: string;
  field_name: string;
  value: string;
  source_document_id: string | null;
  confidence: number | null;
  verified: boolean;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentRow {
  id: string;
  user_id: string;
  document_type: DocumentType | string;
  storage_path: string;
  original_filename: string | null;
  mime_type: string | null;
  status: DocumentStatus;
  ocr_raw_text: string | null;
  is_superseded: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExtractedField {
  id: string;
  document_id: string;
  field_name: string;
  raw_value: string;
  normalized_value: string | null;
  confidence: number | null;
  accepted: boolean;
  created_at: string;
}

export interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  official_url: string;
  official_domain: string;
  category: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ServiceRequirement {
  id: string;
  service_id: string;
  requirement_type: RequirementType;
  field_name: string | null;
  label: string;
  required: boolean;
  guidance_text: string | null;
  notes: string | null;
  display_order: number;
  created_at: string;
}

export interface RequirementStatusRow {
  id: string;
  user_id: string;
  requirement_id: string;
  status: RequirementSatisfactionStatus;
  satisfied_by_document_id: string | null;
  satisfied_by_field_name: string | null;
  resolved_note: string | null;
  locked: boolean;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profile_fields: {
        Row: ProfileField;
        Insert: Omit<ProfileField, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ProfileField, 'id'>>;
      };
      documents: {
        Row: DocumentRow;
        Insert: Omit<DocumentRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<DocumentRow, 'id'>>;
      };
      extracted_fields: {
        Row: ExtractedField;
        Insert: Omit<ExtractedField, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ExtractedField, 'id'>>;
      };
      services: {
        Row: ServiceRow;
        Insert: Omit<ServiceRow, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ServiceRow, 'id'>>;
      };
      service_requirements: {
        Row: ServiceRequirement;
        Insert: Omit<ServiceRequirement, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ServiceRequirement, 'id'>>;
      };
      requirement_status: {
        Row: RequirementStatusRow;
        Insert: Omit<RequirementStatusRow, 'id' | 'updated_at'> & {
          id?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<RequirementStatusRow, 'id'>>;
      };
    };
    Functions: {
      recompute_requirement_status: {
        Args: { p_user_id: string; p_service_id: string };
        Returns: void;
      };
      mark_requirement_resolved: {
        Args: { p_user_id: string; p_requirement_id: string; p_note?: string | null };
        Returns: void;
      };
      unmark_requirement_resolved: {
        Args: { p_user_id: string; p_requirement_id: string };
        Returns: void;
      };
    };
  };
}
