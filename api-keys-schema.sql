-- ============================================================
-- CareSync — API Keys Schema Extension
-- Run this in the Supabase SQL Editor to add the API keys table.
-- ============================================================

-- Developer API Keys for external integrations
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  "keyHash" VARCHAR(255) NOT NULL,
  "keyPrefix" VARCHAR(8) NOT NULL,
  scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
  "rateLimitPerHour" INTEGER DEFAULT 1000,
  "isActive" BOOLEAN DEFAULT true,
  "lastUsedAt" TIMESTAMP WITH TIME ZONE,
  "expiresAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys("userId");
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys("keyPrefix");
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys("isActive");

-- ============================================================
-- Done! API keys table created.
-- ============================================================
