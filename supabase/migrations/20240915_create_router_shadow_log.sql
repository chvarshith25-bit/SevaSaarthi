-- =====================================================================
-- SEVA SAARTHI — MIGRATION 20240915: CREATE SHADOW LOG TABLE
-- Phase 7D.2: AI Model 1 V2 Shadow Mode Telemetry
-- =====================================================================

CREATE TABLE IF NOT EXISTS router_shadow_log (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id        text NOT NULL,
  user_id           text,
  v1_service_id     uuid,
  v1_confidence    numeric(5,3) NOT NULL,
  v2_service_id     uuid,
  v2_probability   numeric(5,3) NOT NULL,
  v2_tier          text NOT NULL CHECK (v2_tier IN ('AUTOMATIC_RECOMMENDATION','HUMAN_CONFIRMATION_REQUIRED','MANUAL_REVIEW')),
  ood_flag          boolean NOT NULL,
  agreement         boolean NOT NULL,
  recommendation_diff text,
  v1_version        text NOT NULL,
  v2_version        text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_router_shadow_req ON router_shadow_log(request_id);
CREATE INDEX IF NOT EXISTS idx_router_shadow_user ON router_shadow_log(user_id);
CREATE INDEX IF NOT EXISTS idx_router_shadow_service_v1 ON router_shadow_log(v1_service_id);
CREATE INDEX IF NOT EXISTS idx_router_shadow_service_v2 ON router_shadow_log(v2_service_id);
CREATE INDEX IF NOT EXISTS idx_router_shadow_created ON router_shadow_log(created_at);

