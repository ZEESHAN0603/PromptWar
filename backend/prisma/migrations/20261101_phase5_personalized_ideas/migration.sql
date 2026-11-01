-- EventPilot AI: Phase 5 Migration Script
-- Personalized Celebration Ideas Engine
-- Target: Supabase PostgreSQL
-- Model: personalized_ideas (extensions)
-- Safety: Non-destructive, idempotent DDL (No DROP/TRUNCATE)

-- 1. Add content column if missing
ALTER TABLE "public"."personalized_ideas" ADD COLUMN IF NOT EXISTS "content" JSONB;

-- 2. Add generationId column if missing
ALTER TABLE "public"."personalized_ideas" ADD COLUMN IF NOT EXISTS "generationId" TEXT;

-- 3. Add index on generationId for efficient batch queries
CREATE INDEX IF NOT EXISTS "personalized_ideas_generationId_idx" ON "public"."personalized_ideas"("generationId");

