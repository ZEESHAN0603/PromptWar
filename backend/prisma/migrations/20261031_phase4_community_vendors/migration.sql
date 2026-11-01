-- EventPilot AI: Phase 4 Migration Script
-- Community Vendor Recommendation System
-- Target: Supabase PostgreSQL
-- Models: community_vendors, vendor_contributions, my_vendors, event_vendors
-- Extensions to: profiles (role), expenses (eventVendorId)
-- Safety: Non-destructive, idempotent DDL (No DROP/TRUNCATE)

-- 1. Ensure public schema exists
CREATE SCHEMA IF NOT EXISTS "public";

-- 2. Add role column to profiles table if missing
ALTER TABLE "public"."profiles" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'user';
CREATE INDEX IF NOT EXISTS "profiles_role_idx" ON "public"."profiles"("role");

-- 3. Create community_vendors table
CREATE TABLE IF NOT EXISTS "public"."community_vendors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "address" TEXT,
    "publicPhone" TEXT,
    "publicEmail" TEXT,
    "websiteUrl" TEXT,
    "socialLinks" JSONB,
    "serviceAreas" JSONB,
    "eventTypes" JSONB,
    "priceInformation" JSONB,
    "rating" DECIMAL(3,2),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_vendors_pkey" PRIMARY KEY ("id")
);

-- Unique constraint & indexes on community_vendors
CREATE UNIQUE INDEX IF NOT EXISTS "community_vendors_slug_key" ON "public"."community_vendors"("slug");
CREATE INDEX IF NOT EXISTS "community_vendors_category_idx" ON "public"."community_vendors"("category");
CREATE INDEX IF NOT EXISTS "community_vendors_city_idx" ON "public"."community_vendors"("city");
CREATE INDEX IF NOT EXISTS "community_vendors_status_idx" ON "public"."community_vendors"("status");

-- 4. Create vendor_contributions table
CREATE TABLE IF NOT EXISTS "public"."vendor_contributions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendorId" UUID NOT NULL,
    "submittedBy" UUID NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "sourceDescription" TEXT,
    "privateNotes" TEXT,
    "consentConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "reviewStatus" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_contributions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "vendor_contributions_vendorId_idx" ON "public"."vendor_contributions"("vendorId");
CREATE INDEX IF NOT EXISTS "vendor_contributions_submittedBy_idx" ON "public"."vendor_contributions"("submittedBy");
CREATE INDEX IF NOT EXISTS "vendor_contributions_reviewStatus_idx" ON "public"."vendor_contributions"("reviewStatus");

-- 5. Create my_vendors table (User saved vendors)
CREATE TABLE IF NOT EXISTS "public"."my_vendors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "personalNotes" TEXT,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "my_vendors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "my_vendors_userId_vendorId_key" ON "public"."my_vendors"("userId", "vendorId");
CREATE INDEX IF NOT EXISTS "my_vendors_userId_idx" ON "public"."my_vendors"("userId");
CREATE INDEX IF NOT EXISTS "my_vendors_vendorId_idx" ON "public"."my_vendors"("vendorId");

-- 6. Create event_vendors table (Event specific vendor selections)
CREATE TABLE IF NOT EXISTS "public"."event_vendors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventId" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "selectionStatus" TEXT NOT NULL DEFAULT 'shortlisted',
    "contactStatus" TEXT NOT NULL DEFAULT 'not_contacted',
    "estimatedCost" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "actualCost" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "privateNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_vendors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "event_vendors_eventId_vendorId_key" ON "public"."event_vendors"("eventId", "vendorId");
CREATE INDEX IF NOT EXISTS "event_vendors_eventId_idx" ON "public"."event_vendors"("eventId");
CREATE INDEX IF NOT EXISTS "event_vendors_vendorId_idx" ON "public"."event_vendors"("vendorId");
CREATE INDEX IF NOT EXISTS "event_vendors_selectionStatus_idx" ON "public"."event_vendors"("selectionStatus");

-- 7. Add eventVendorId column to expenses table if missing
ALTER TABLE "public"."expenses" ADD COLUMN IF NOT EXISTS "eventVendorId" UUID;
CREATE INDEX IF NOT EXISTS "expenses_eventVendorId_idx" ON "public"."expenses"("eventVendorId");

-- 8. Add Foreign Keys with IF NOT EXISTS logic
DO $$
BEGIN
    -- vendor_contributions -> community_vendors
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'vendor_contributions_vendorId_fkey'
    ) THEN
        ALTER TABLE "public"."vendor_contributions"
        ADD CONSTRAINT "vendor_contributions_vendorId_fkey"
        FOREIGN KEY ("vendorId") REFERENCES "public"."community_vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- vendor_contributions -> profiles (submitter)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'vendor_contributions_submittedBy_fkey'
    ) THEN
        ALTER TABLE "public"."vendor_contributions"
        ADD CONSTRAINT "vendor_contributions_submittedBy_fkey"
        FOREIGN KEY ("submittedBy") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- vendor_contributions -> profiles (reviewer)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'vendor_contributions_reviewedBy_fkey'
    ) THEN
        ALTER TABLE "public"."vendor_contributions"
        ADD CONSTRAINT "vendor_contributions_reviewedBy_fkey"
        FOREIGN KEY ("reviewedBy") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- my_vendors -> profiles (user)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'my_vendors_userId_fkey'
    ) THEN
        ALTER TABLE "public"."my_vendors"
        ADD CONSTRAINT "my_vendors_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- my_vendors -> community_vendors
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'my_vendors_vendorId_fkey'
    ) THEN
        ALTER TABLE "public"."my_vendors"
        ADD CONSTRAINT "my_vendors_vendorId_fkey"
        FOREIGN KEY ("vendorId") REFERENCES "public"."community_vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- event_vendors -> events
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'event_vendors_eventId_fkey'
    ) THEN
        ALTER TABLE "public"."event_vendors"
        ADD CONSTRAINT "event_vendors_eventId_fkey"
        FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- event_vendors -> community_vendors
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'event_vendors_vendorId_fkey'
    ) THEN
        ALTER TABLE "public"."event_vendors"
        ADD CONSTRAINT "event_vendors_vendorId_fkey"
        FOREIGN KEY ("vendorId") REFERENCES "public"."community_vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- expenses -> event_vendors
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'expenses_eventVendorId_fkey'
    ) THEN
        ALTER TABLE "public"."expenses"
        ADD CONSTRAINT "expenses_eventVendorId_fkey"
        FOREIGN KEY ("eventVendorId") REFERENCES "public"."event_vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

