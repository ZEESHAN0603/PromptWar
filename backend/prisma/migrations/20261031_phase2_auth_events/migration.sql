-- EventPilot AI: Phase 2 Migration Script
-- Target: Supabase PostgreSQL
-- Models: profiles, events
-- Safety: Non-destructive, idempotent DDL (No DROP/TRUNCATE)

-- 1. Ensure public schema exists
CREATE SCHEMA IF NOT EXISTS "public";

-- 2. Create profiles table linked to Supabase auth.users (id as UUID)
CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "avatarUrl" TEXT,
    "phoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- 3. Create events table (id and userId as UUID)
CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Wedding',
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT,
    "budget" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "guestCount" INTEGER NOT NULL DEFAULT 0,
    "theme" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'planning',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- 4. Create Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "profiles_email_key" ON "public"."profiles"("email");
CREATE INDEX IF NOT EXISTS "events_userId_idx" ON "public"."events"("userId");
CREATE INDEX IF NOT EXISTS "events_status_idx" ON "public"."events"("status");
CREATE INDEX IF NOT EXISTS "events_date_idx" ON "public"."events"("date");

-- 5. Foreign Key: profiles.id -> auth.users.id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'users'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_id_fkey'
    ) THEN
        ALTER TABLE "public"."profiles"
        ADD CONSTRAINT "profiles_id_fkey"
        FOREIGN KEY ("id")
        REFERENCES "auth"."users"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END $$;

-- 6. Foreign Key: events.userId -> profiles.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'events_userId_fkey'
    ) THEN
        ALTER TABLE "public"."events"
        ADD CONSTRAINT "events_userId_fkey"
        FOREIGN KEY ("userId")
        REFERENCES "public"."profiles"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END $$;
