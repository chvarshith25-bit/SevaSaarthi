-- =====================================================================
-- SEVA SAARTHI — MIGRATION 20240915: CREATE MODEL 2 SHADOW LOG TABLE
-- Phase 7E.2: AI Model 2 V2.1 Shadow Mode Telemetry
-- =====================================================================

CREATE TABLE IF NOT EXISTS model2_shadow_log (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id              text NOT NULL,
  created_at              timestamptz NOT NULL DEFAULT now(),
  v1_model_version        text NOT NULL,
  v2_model_version        text NOT NULL,
  v1_top_candidate_id     text,
  v1_confidence           numeric(5,4),
  v1_tier                 text,
  v2_top_candidate_id     text,
  v2_probability          numeric(5,4),
  v2_tier                 text,
  is_ambiguous            boolean NOT NULL DEFAULT false,
  collision_warning       boolean NOT NULL DEFAULT false,
  agreement               boolean NOT NULL,
  disagreement_category   text,
  fallback_used           boolean NOT NULL DEFAULT false,
  v1_latency_ms           numeric(8,2) NOT NULL DEFAULT 0.0,
  v2_latency_ms           numeric(8,2) NOT NULL DEFAULT 0.0
);

-- Indexes for efficient telemetry queries
CREATE INDEX IF NOT EXISTS idx_model2_shadow_req ON model2_shadow_log(request_id);
CREATE INDEX IF NOT EXISTS idx_model2_shadow_agreement ON model2_shadow_log(agreement);
CREATE INDEX IF NOT EXISTS idx_model2_shadow_created ON model2_shadow_log(created_at);
