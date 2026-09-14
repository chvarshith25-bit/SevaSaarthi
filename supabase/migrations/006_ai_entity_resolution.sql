-- =====================================================================
-- SEVA SAARTHI — MIGRATION 006: AI MODEL 2 ENTITY RESOLUTION STORAGE
-- Phase 6: End-to-End AI Integration
-- =====================================================================

CREATE TABLE IF NOT EXISTS application_entity_resolutions (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id              uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  model_version               text NOT NULL DEFAULT 'entity-resolution-v1',
  candidate_registry          text NOT NULL,
  candidate_record_id         text NOT NULL,
  total_score                 numeric(4,3) NOT NULL CHECK (total_score >= 0 AND total_score <= 1),
  field_scores                jsonb NOT NULL DEFAULT '{}'::jsonb,
  matched_fields              text[] DEFAULT ARRAY[]::text[],
  confidence_tier             text NOT NULL CHECK (confidence_tier IN ('HIGH', 'MEDIUM', 'LOW', 'AMBIGUOUS')),
  is_collision_warning        boolean NOT NULL DEFAULT false,
  collision_reason            text,
  corroboration_reason        text,
  explanation                 text NOT NULL,
  raw_record                  jsonb DEFAULT '{}'::jsonb,
  review_status               text NOT NULL DEFAULT 'PENDING' CHECK (review_status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'VERIFICATION_REQUIRED')),
  reviewed_by                 uuid REFERENCES employees(id),
  reviewed_at                 timestamptz,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entity_res_app
ON application_entity_resolutions(application_id);

CREATE INDEX IF NOT EXISTS idx_entity_res_status
ON application_entity_resolutions(review_status);

ALTER TABLE application_entity_resolutions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "officers view entity resolutions" ON application_entity_resolutions;
CREATE POLICY "officers view entity resolutions" ON application_entity_resolutions
  FOR ALL USING (true);
