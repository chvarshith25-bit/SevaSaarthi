-- =====================================================================
-- SEVA SAARTHI — MIGRATION 004: AI WORKFLOW ROUTING RECOMMENDATIONS
-- Phase 3: AI Model 1 Recommender Storage
-- =====================================================================

CREATE TABLE IF NOT EXISTS application_routing_recommendations (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id              uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  model_version               text NOT NULL DEFAULT 'workflow-router-v1',
  suggested_service_id        uuid NOT NULL REFERENCES services(id),
  suggested_department_id     uuid REFERENCES departments(id),
  suggested_sub_department_id uuid REFERENCES sub_departments(id),
  suggested_office_id         uuid REFERENCES offices(id),
  suggested_workflow_id       uuid REFERENCES workflow_definitions(id),
  confidence_score            numeric(4,3) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  routing_mode                text NOT NULL CHECK (routing_mode IN ('RULE_BASED', 'AI_RECOMMENDED', 'AI_CONFIRMED', 'MANUAL_REVIEW_REQUIRED')),
  explanation                 text NOT NULL,
  required_verification_types text[] DEFAULT ARRAY[]::text[],
  status                      text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'OVERRIDDEN', 'REJECTED')),
  officer_override_reason     text,
  reviewed_by                 uuid REFERENCES employees(id),
  reviewed_at                 timestamptz,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routing_rec_app
ON application_routing_recommendations(application_id);

CREATE INDEX IF NOT EXISTS idx_routing_rec_status
ON application_routing_recommendations(status);

ALTER TABLE application_routing_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "officers view recommendations" ON application_routing_recommendations;
CREATE POLICY "officers view recommendations" ON application_routing_recommendations
  FOR ALL USING (true);
